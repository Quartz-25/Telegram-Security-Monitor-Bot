export namespace Model {
  type InvalidRequest = {
    requestInfo: {
      method: string;
      route: string;
      statusCode: number;
      statusMessage?: string;
      time: string | number;
      sender: {
        ip: string;
        port?: number;
        device: string;
        userAgentRaw: string;
        protocol: string;
        hostname: string;
        referer?: string;
        authenticatedUserId?: string;
      };
      requestDetails: {
        queryParameters?: Record<string, any>;
        routeParameters?: Record<string, any>;
        bodySize?: number;
        headers?: Record<string, string | string[]>;
      };
    },
    isIpBlocked: boolean;
    timestamp: Date;
    eventType: string;
  };

  type BlockedIP = {
    ipAddress: string;
    reason: string;
    timestamp: Date;
  }
}
