messenger.menus.create({
  id: "filter-by-senders",
  title: "Filter by these senders",
  contexts: ["message_list"]
});

messenger.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "filter-by-senders") return;

  const messages = info.selectedMessages?.messages ?? [];
  const senders = new Set();
  for (const msg of messages) {
    const match = msg.author.match(/<([^>]+)>/);
    senders.add((match ? match[1] : msg.author).trim().toLowerCase());
  }
  if (senders.size === 0) return;

  await messenger.mailTabs.setQuickFilter(tab.id, {
    text: { text: [...senders].join("|"), author: true }
  });
  filteredTabs.add(tab.id);
});

// Reset the filter once every filtered message has been deleted.
const filteredTabs = new Set();

async function resetIfEmpty() {
  await new Promise(r => setTimeout(r, 300));
  for (const tabId of filteredTabs) {
    const listed = await messenger.mailTabs.getListedMessages(tabId).catch(() => null);
    if (!listed) { filteredTabs.delete(tabId); continue; }
    if (listed.messages.length === 0) {
      await messenger.mailTabs.setQuickFilter(tabId, {});
      filteredTabs.delete(tabId);
    }
  }
}

messenger.messages.onDeleted.addListener(resetIfEmpty);
messenger.messages.onMoved.addListener(resetIfEmpty);
