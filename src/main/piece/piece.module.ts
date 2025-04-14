import {RobloxApiModule} from '@main/roblox-api/roblox-api.module'
import {Module} from '@nestjs/common'
import {PieceIpcService} from './services/piece-ipc.service'
import {PieceLinkService} from './services/piece-link.service'
import {PieceNotificationService} from './services/piece-notification.service'
import {PiecePruneService} from './services/piece-prune.service'
import {PieceUploadService} from './services/piece-upload.service'
import {PieceController} from './piece.controller'
import {PieceGltfService} from './services/piece.gltf.service'
import {PieceProvider} from './piece.provider'
import {PieceService} from './services/piece.service'
import {PieceUploadQueue, PieceWatcherQueue} from './queue'
import {PieceWatcher} from './watcher'

@Module({
  providers: [
    PieceIpcService,
    PieceLinkService,
    PieceNotificationService,
    PiecePruneService,
    PieceUploadQueue,
    PieceProvider,
    PieceUploadService,
    PieceWatcherQueue,
    PieceService,
    PieceWatcher,
    PieceGltfService,
  ],
  controllers: [PieceController],
  imports: [RobloxApiModule],
  exports: [PieceService, PieceUploadService, PieceLinkService],
})
export class PieceModule {}
