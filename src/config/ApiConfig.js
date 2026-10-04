class ApiConfig {
  static productionBaseUrl = "https://crop-disease-detector-8nqt.onrender.com";
  static localBaseUrl = "http://localhost:8080";

  static getEnvBaseUrl() {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return (
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        import.meta.env.VITE_API_URL ||
        import.meta.env.REACT_APP_API_URL ||
        this.productionBaseUrl
      );
    }

    return this.productionBaseUrl;
  }

  static setBaseUrl(url) {
    this.productionBaseUrl = url;
  }

  static getBaseUrl() {
    const envBaseUrl = this.getEnvBaseUrl();

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return envBaseUrl.includes("localhost") || envBaseUrl.includes("127.0.0.1")
          ? envBaseUrl
          : this.localBaseUrl;
      }
    }

    return envBaseUrl;
  }

  static buildUrl(path = "") {
    const baseUrl = this.getBaseUrl().replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  }

  static getCameraStreamUrl() {
    const baseUrl = this.getBaseUrl();

    if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      return "ws://localhost:8080/camera-stream";
    }

    return `${baseUrl.replace(/^http/, "ws")}/camera-stream`;
  }
}

export default ApiConfig;
