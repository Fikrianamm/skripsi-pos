import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  host: process.env.PUSHER_HOST!,
  port: process.env.PUSHER_PORT!,
  useTLS: process.env.PUSHER_SCHEME === "https",
});
