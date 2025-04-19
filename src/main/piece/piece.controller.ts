import {createReadStream} from 'node:fs'
import {CreatePieceDto} from '@main/piece/dto'
import {UpdatePieceDto} from '@main/piece/dto/update-piece.dto'
import {UpsertPieceUploadDto} from '@main/piece/dto/upsert-piece-upload.dto'
import {PieceLinkService} from '@main/piece/services/piece-link.service'
import {PieceNotificationService} from '@main/piece/services/piece-notification.service'
import {PieceUploadService} from '@main/piece/services/piece-upload.service'
import {PieceGltfService} from '@main/piece/services/piece.gltf.service'
import {PieceService} from '@main/piece/services/piece.service'
import {RobloxApiService} from '@main/roblox-api/roblox-api.service'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common'

@Controller('api/pieces')
export class PieceController {
  constructor(
    private readonly pieceService: PieceService,
    private readonly pieceGltfService: PieceGltfService,
    private readonly pieceUploadService: PieceUploadService,
    private readonly pieceNotificationService: PieceNotificationService,
    private readonly pieceLinkService: PieceLinkService,
    private readonly robloxApiService: RobloxApiService,
  ) {
    //
  }

  @Get('/')
  async find(@Query() query: any) {
    return this.pieceService.findMany({...query})
  }

  @Post('/')
  async create(@Body() createPieceDto: CreatePieceDto) {
    return await this.pieceService.create(createPieceDto)
  }

  @Get('/notify')
  async notify() {
    return this.pieceNotificationService.notify()
  }

  @Get('/symlinks-sync')
  async symlinksSync() {
    await this.pieceLinkService.syncLinks()
    return true
  }

  @Get('/:id')
  async get(@Param('id') id: string) {
    return this.pieceService.getPieceById(id)
  }

  @Get('/:id/raw')
  async getRaw(@Param('id') id: string) {
    return this.pieceService.getRaw(id)
  }

  @Get('/:id/mesh/:key')
  async getMesh(@Param('id') id: string, @Param('key') key: string) {
    const piece = this.pieceService.getPieceById(id)
    return this.pieceGltfService.getRbxMesh(piece, key)
  }

  @Get('/:id/metadata')
  async getMetadata(@Param('id') id: string) {
    const piece = this.pieceService.getPieceById(id)
    return this.pieceGltfService.getPieceMetadata(piece)
  }

  @Get('/:id/preview')
  async getPreview(@Param('id') id: string): Promise<StreamableFile> {
    const piece = this.pieceService.getPieceById(id)
    const type = this.pieceService.getPieceMime(piece)

    const file = createReadStream(this.pieceService.getPiecePreviewPath(piece))
    return new StreamableFile(file, {type})
  }

  @Patch('/:id')
  async update(@Param('id') id: string, @Body() updatePieceDto: UpdatePieceDto) {
    const piece = this.pieceService.getPieceById(id)

    await this.pieceService.update(piece, updatePieceDto)

    return piece
  }

  @Post('/:id/uploads')
  async upsertUpload(@Param('id') id: string, @Body() dto: UpsertPieceUploadDto) {
    const piece = this.pieceService.getPieceById(id)

    await this.pieceService.upsertUpload(piece, dto)

    return piece
  }

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    const piece = this.pieceService.getPieceById(id)
    await this.pieceService.delete(piece)
    return piece
  }

  @Post('/:id/asset')
  async createAsset(@Param('id') id: string) {
    const piece = this.pieceService.getPieceById(id)
    await this.pieceUploadService.queueUploadAsset(piece)
    return piece
  }

  @Get('/:id/operation')
  async getOperation(@Param('id') id: string) {
    return this.robloxApiService.getAssetOperationResultRetry(id)
  }

  @Get('/:id/decal')
  async getFromDecal(@Param('id') id: string) {
    return this.robloxApiService.getImageFromDecal(id)
  }
}
