declare module 'jsmediatags' {
  interface TagsReadResult {
    tags: Record<string, unknown>;
  }

  interface ReadCallbacks {
    onSuccess: (result: TagsReadResult) => void;
    onError: () => void;
  }

  const jsmediatags: {
    read: (file: File, callbacks: ReadCallbacks) => void;
  };

  export default jsmediatags;
}

declare module 'jsmediatags/dist/jsmediatags.min.js' {
  const jsmediatags: {
    read: (
      file: File,
      callbacks: {
        onSuccess: (result: { tags: Record<string, unknown> }) => void;
        onError: () => void;
      }
    ) => void;
  };

  export default jsmediatags;
}
