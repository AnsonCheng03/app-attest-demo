import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { styles } from './styles';
import type { LogGroup } from './types';

export function ActivityLogCard({
  loading,
  logGroups,
  requestStatus,
}: {
  loading: boolean;
  logGroups: LogGroup[];
  requestStatus: string;
}) {
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  useEffect(() => {
    setSelectedGroupIndex(0);
  }, [logGroups.length]);

  const selectedGroup = logGroups[selectedGroupIndex];
  const canGoNewer = selectedGroupIndex > 0;
  const canGoOlder = selectedGroupIndex < logGroups.length - 1;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Activity Log</Text>
      {logGroups.length ? (
        <>
          <View style={styles.logNavRow}>
            <Pressable
              style={[
                styles.logNavButton,
                !canGoNewer ? styles.logNavButtonDisabled : null,
              ]}
              onPress={() =>
                canGoNewer &&
                setSelectedGroupIndex((current) => Math.max(0, current - 1))
              }
            >
              <Text style={styles.logNavButtonText}>Left</Text>
            </Pressable>
            <Text style={styles.logPagerText}>
              {selectedGroupIndex + 1} / {logGroups.length}
            </Text>
            <Pressable
              style={[
                styles.logNavButton,
                !canGoOlder ? styles.logNavButtonDisabled : null,
              ]}
              onPress={() =>
                canGoOlder &&
                setSelectedGroupIndex((current) =>
                  Math.min(logGroups.length - 1, current + 1)
                )
              }
            >
              <Text style={styles.logNavButtonText}>Right</Text>
            </Pressable>
          </View>

          <View style={styles.logGroupHeader}>
            <Text style={styles.logGroupFlowTitle}>{selectedGroup.flowTitle}</Text>
            <Text style={styles.logGroupTitle}>{selectedGroup.title}</Text>
            <Text style={styles.helperText}>
              Status: {selectedGroup.status}
            </Text>
          </View>

          {loading && selectedGroupIndex === 0 ? (
            <View style={styles.requestStatusRow}>
              <ActivityIndicator color="#0f766e" />
              <Text style={styles.requestStatusText}>
                {requestStatus || 'Working...'}
              </Text>
            </View>
          ) : requestStatus && selectedGroupIndex === 0 ? (
            <Text style={styles.helperText}>{requestStatus}</Text>
          ) : null}

          {selectedGroup.entries.map((entry) => (
            <View key={entry.id} style={styles.logEntryCard}>
              <Text
                style={[
                  styles.logEntryTitle,
                  entry.tone === 'error'
                    ? styles.logEntryTitleError
                    : entry.tone === 'success'
                      ? styles.logEntryTitleSuccess
                      : null,
                ]}
              >
                {entry.title}
              </Text>
              {entry.detail ? (
                <Text style={styles.logLine}>{entry.detail}</Text>
              ) : null}
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.helperText}>
          No activity yet. Tap an action button to start a new log section.
        </Text>
      )}
    </View>
  );
}
