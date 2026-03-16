export interface User {
  id: string;
  handle: string;
  bio: string;
  followers: string[];
  following: string[];
}

export interface Post {
  id: string;
  userId: string;
  handle: string;
  content: string;
  createdAt: Date;
  likes: string[];
  reposts: string[];
  replyTo?: string;
  repostOf?: string;
}

export const CURRENT_USER_ID = "u1";

export const mockUsers: User[] = [
  { id: "u1", handle: "nullcoder", bio: "Building in the void.", followers: ["u2", "u3", "u5"], following: ["u2", "u4"] },
  { id: "u2", handle: "bytesmith", bio: "Systems thinker. Signal over noise.", followers: ["u1", "u4"], following: ["u1", "u3"] },
  { id: "u3", handle: "stdin_echo", bio: "Piping thoughts to /dev/world.", followers: ["u2"], following: ["u1"] },
  { id: "u4", handle: "void_ptr", bio: "Dereferencing the internet.", followers: ["u1"], following: ["u2", "u5"] },
  { id: "u5", handle: "chmod_777", bio: "Open permissions, open mind.", followers: ["u4"], following: ["u1"] },
];

const now = Date.now();
const h = (hours: number) => new Date(now - hours * 3600000);

export const mockPosts: Post[] = [
  { id: "p1", userId: "u2", handle: "bytesmith", content: "The best interfaces are the ones you don't notice. They disappear into the task.", createdAt: h(0.5), likes: ["u1", "u3"], reposts: [] },
  { id: "p2", userId: "u1", handle: "nullcoder", content: "Shipped a new feature today. No images, no avatars, just **text**. The way the web was meant to be.", createdAt: h(1), likes: ["u2", "u4", "u5"], reposts: ["u3"] },
  { id: "p3", userId: "u3", handle: "stdin_echo", content: "```\nwhile true; do\n  think | filter | publish\ndone\n```\nMy entire content strategy.", createdAt: h(2), likes: ["u1"], reposts: [] },
  { id: "p4", userId: "u4", handle: "void_ptr", content: "Hot take: every social platform dies when it prioritizes *engagement* over *signal*. We need more protocols, fewer products.", createdAt: h(3.5), likes: ["u1", "u2", "u3"], reposts: ["u1"] },
  { id: "p5", userId: "u5", handle: "chmod_777", content: "Just discovered you can pipe `curl` output directly into `jq` and then into `pbcopy`. My clipboard has never been so structured.", createdAt: h(5), likes: ["u4"], reposts: [] },
  { id: "p6", userId: "u2", handle: "bytesmith", content: "Minimalism isn't about having less. It's about making room for what matters. In code and in life.", createdAt: h(8), likes: ["u1", "u5"], reposts: ["u4"] },
  { id: "p7", userId: "u1", handle: "nullcoder", content: "Reading through old commit messages is like archaeology. Each one a fossil of a decision that once felt urgent.", createdAt: h(12), likes: ["u2"], reposts: [] },
  { id: "p8", userId: "u3", handle: "stdin_echo", content: "The terminal doesn't judge your CSS. It just works.", createdAt: h(18), likes: ["u1", "u2", "u4", "u5"], reposts: ["u1", "u2"] },
];
