import {RobloxApiModule} from '@main/roblox-api/roblox-api.module'
import {Module} from '@nestjs/common'
import {AnalyticsService} from '@main/analytics/analytics.service'
import {PieceController} from './piece.controller'
import {PieceProvider} from './piece.provider'
import {PieceUploadQueue, PieceWatcherQueue} from './queue'
import {PieceIpcService} from './services/piece-ipc.service'
import {PieceLinkService} from './services/piece-link.service'
import {PieceNotificationService} from './services/piece-notification.service'
import {PiecePruneService} from './services/piece-prune.service'
import {PieceUploadService} from './services/piece-upload.service'
import {PieceGltfService} from './services/piece.gltf.service'
import {PieceService} from './services/piece.service'
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
    AnalyticsService,
  ],
  controllers: [PieceController],
  imports: [RobloxApiModule],
  exports: [PieceService, PieceUploadService, PieceLinkService],
})
export class PieceModule {}
