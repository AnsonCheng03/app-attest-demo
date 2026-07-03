package com.anson12666.integritydemo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.integrity")
public class AppIntegrityProperties {

    private IntegrityMode mode = IntegrityMode.mock;
    private final Android android = new Android();
    private final Ios ios = new Ios();

    public IntegrityMode getMode() {
        return mode;
    }

    public void setMode(IntegrityMode mode) {
        this.mode = mode;
    }

    public boolean isMockMode() {
        return mode == IntegrityMode.mock;
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
        private boolean allowUnverifiedTokens = true;

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

        public boolean isAllowUnverifiedTokens() {
            return allowUnverifiedTokens;
        }

        public void setAllowUnverifiedTokens(boolean allowUnverifiedTokens) {
            this.allowUnverifiedTokens = allowUnverifiedTokens;
        }
    }

    public static class Ios {
        private String bundleId;
        private String teamId;
        private AppAttestEnvironment appAttestEnvironment = AppAttestEnvironment.development;

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

        public AppAttestEnvironment getAppAttestEnvironment() {
            return appAttestEnvironment;
        }

        public void setAppAttestEnvironment(AppAttestEnvironment appAttestEnvironment) {
            this.appAttestEnvironment = appAttestEnvironment;
        }

        public boolean isProduction() {
            return appAttestEnvironment == AppAttestEnvironment.production;
        }
    }
}
