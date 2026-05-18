import PusherClient from "pusher-js";

// Singleton to prevent multiple connections in development/hot-reload
let _client: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!_client) {
    _client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST!,
      wsPort: Number(process.env.NEXT_PUBLIC_PUSHER_PORT || 6001),
      wssPort: Number(process.env.NEXT_PUBLIC_PUSHER_PORT || 6001),
      cluster: "mt1",
      forceTLS: false,
      enabledTransports: ["ws", "wss"],
      disableStats: true, // Soketi doesn't support statistics
      authEndpoint: "/api/pusher/auth", // Endpoint for private channels
    });
  }
  return _client;
}
