export enum PieceEventEnum {
  initiated = 'piece.initiated', // piece initiated, on app startup
  updated = 'piece.updated', // piece field updated

  created = 'piece.created', // file created
  changed = 'piece.changed', // file changed
  deleted = 'piece.deleted', // file deleted
  uploaded = 'piece.uploaded', // file uploaded

  enabledAutoUpload = 'piece.enabled-auto-upload', // isAutoUpload changed to true
  watcherReady = 'piece.watcher.ready', // peace watcher started watching and scanned dir
}
