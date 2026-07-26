// Cross-component signals kept as window CustomEvents (matching the old
// static site's decoupled-scripts pattern) rather than React context, since
// the header and the home feed's "Bookmarked only" toggle are independent
// components that don't otherwise share a tree.
export const BOOKMARK_TOGGLE_CLICK_EVENT = "gadzeke:bookmark-toggle-click";
