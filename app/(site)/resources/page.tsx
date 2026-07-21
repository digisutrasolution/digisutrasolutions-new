import { permanentRedirect } from "next/navigation";

/* The tools hub moved to /free-tools — keep the old URL alive for links,
   bookmarks and anything already indexed. */
export default function ResourcesRedirect() {
  permanentRedirect("/free-tools");
}
