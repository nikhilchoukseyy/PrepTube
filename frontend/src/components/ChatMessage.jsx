const ChatMessage = ({ message, nameSuffix = null }) => {
  const sender = message?.sender || {};
  const senderName = sender.username || sender.name || sender.email || "User";
  const avatar = sender.avatar;

  return (
    <div className="flex gap-3 items-start">
      {avatar ? (
        <img src={avatar} alt={senderName} className="w-9 h-9 rounded-full object-cover border border-white/10" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
          {senderName[0]?.toUpperCase() || "U"}
        </div>
      )}
      <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] space-y-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-gray-400 font-medium">{senderName}</p>
            {nameSuffix}
          </div>
          {message.createdAt && (
            <p className="text-[11px] text-gray-500">{new Date(message.createdAt).toLocaleString()}</p>
          )}
        </div>

        {message.messageType === "image" && message.mediaUrl ? (
          <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="block">
            <img src={message.mediaUrl} alt="Shared in chat" className="max-h-64 rounded-xl border border-white/10" />
          </a>
        ) : null}

        {message.messageType === "voice" && message.mediaUrl ? (
          <audio controls className="w-full max-w-xs">
            <source src={message.mediaUrl} />
          </audio>
        ) : null}

        {message.message ? <p className="text-sm text-gray-100 whitespace-pre-wrap">{message.message}</p> : null}
      </div>
    </div>
  );
};

export default ChatMessage;
