import {RobloxApiModule} from '@main/roblox-api/roblox-api.module'
import {Module} from '@nestjs/common'
import {PieceIpcService} from './piece-ipc.service'
import {PieceLinkService} from './piece-link.service'
import {PieceNotificationService} from './piece-notification.service'
import {PiecePruneService} from './piece-prune.service'
import {PieceUploadService} from './piece-upload.service'
import {PieceController} from './piece.controller'
import {PieceProvider} from './piece.provider'
import {PieceService} from './piece.service'
import {PieceUploadQueue, PieceWatcherQueue} from './queue'
import {PieceWatcher} from './watcher'

@Module({
  providers: [
    PieceProvider,
    PieceUploadService,
    PieceNotificationService,
    PieceIpcService,
    PiecePruneService,
    PieceUploadQueue,
    PieceWatcherQueue,
    PieceLinkService,
    PieceService,
    PieceWatcher,
  ],
  controllers: [PieceController],
  imports: [RobloxApiModule],
  exports: [PieceService, PieceUploadService, PieceLinkService],
})
export class PieceModule {}
