package com.example.integritydemo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.integrity")
public class AppIntegrityProperties {

    private String mode = "mock";
    private final Android android = new Android();
    private final Ios ios = new Ios();

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public Android getAndroid() {
        return android;
    }

    public Ios getIos() {
        return ios;
    }

    public static class Android {
        private String packageName;
        private String certificateDigest;

        public String getPackageName() {
            return packageName;
        }

        public void setPackageName(String packageName) {
            this.packageName = packageName;
        }

        public String getCertificateDigest() {
            return certificateDigest;
        }

        public void setCertificateDigest(String certificateDigest) {
            this.certificateDigest = certificateDigest;
        }
    }

    public static class Ios {
        private String bundleId;
        private String teamId;
        private String appAttestEnvironment = "development";

        public String getBundleId() {
            return bundleId;
        }

        public void setBundleId(String bundleId) {
            this.bundleId = bundleId;
        }

        public String getTeamId() {
            return teamId;
        }

        public void setTeamId(String teamId) {
            this.teamId = teamId;
        }

        public String getAppAttestEnvironment() {
            return appAttestEnvironment;
        }

        public void setAppAttestEnvironment(String appAttestEnvironment) {
            this.appAttestEnvironment = appAttestEnvironment;
        }
    }
}
