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

  @Get('/:id/raw/:key')
  async getRawUniversal(@Param('id') id: string, @Param('key') key: string) {
    const [internalId, channelName] = key.split('-')

    if (internalId && !channelName) {
      return this.getMesh(id, internalId)
    }

    if (internalId && channelName) {
      return this.getMaterialChannelRaw(id, internalId, channelName)
    }

    return this.pieceService.getRaw(id)
  }

  @Get('/:id/mesh/:meshId')
  async getMesh(@Param('id') id: string, @Param('meshId') meshId: string) {
    const piece = this.pieceService.getPieceById(id)
    return this.pieceGltfService.getMesh(piece, meshId)
  }

  @Get('/:id/mesh/:meshId/raw')
  async getMeshRaw(@Param('id') id: string, @Param('meshId') meshId: string) {
    const piece = this.pieceService.getPieceById(id)
    return this.pieceGltfService.getMeshRaw(piece, meshId)
  }

  @Post('/:id/mesh/:meshId/upload')
  async upsertMeshUpload(@Param('id') id: string, @Param('meshId') meshId: string, @Body() dto: UpsertPieceUploadDto) {
    const piece = this.pieceService.getPieceById(id)
    const mesh = await this.pieceGltfService.getMesh(piece, meshId)
    await this.pieceGltfService.upsertMeshUpload(piece, mesh, dto)
    return mesh
  }

  @Get('/:id/material/:materialId')
  async getMaterial(@Param('id') id: string, @Param('materialId') materialId: string) {
    const piece = this.pieceService.getPieceById(id)
    return this.pieceGltfService.getMaterial(piece, materialId)
  }

  @Get('/:id/material/:materialId/channel/:channel')
  async getMaterialChannel(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
    @Param('channel') channel: string,
  ) {
    const piece = this.pieceService.getPieceById(id)
    return this.pieceGltfService.getMaterialChannel(piece, materialId, channel)
  }

  @Get('/:id/material/:materialId/channel/:channel/raw')
  async getMaterialChannelRaw(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
    @Param('channel') channel: string,
  ) {
    const piece = this.pieceService.getPieceById(id)
    return this.pieceGltfService.getMaterialChannelRaw(piece, materialId, channel)
  }

  @Post('/:id/material/:materialId/channel/:channel/upload')
  async upsertMaterialChannelUpload(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
    @Param('channel') channelName: string,
    @Body() dto: UpsertPieceUploadDto,
  ) {
    const piece = this.pieceService.getPieceById(id)
    const channel = await this.pieceGltfService.getMaterialChannel(piece, materialId, channelName)
    await this.pieceGltfService.upsertMaterialChannelUpload(piece, channel, dto)
    return channel
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

  @Post('/:id/uploads/:key')
  async upsertUploadUniversal(@Param('id') id: string, @Param('key') key: string, @Body() dto: UpsertPieceUploadDto) {
    const piece = this.pieceService.getPieceById(id)

    const [nodeId, channelName] = key.split('-')

    if (nodeId && !channelName) {
      // mesh
      const mesh = await this.pieceGltfService.getMesh(piece, nodeId)
      await this.pieceGltfService.upsertMeshUpload(piece, mesh, dto)
      return mesh
    }

    if (nodeId && channelName) {
      // material channel
      const channel = await this.pieceGltfService.getMaterialChannel(piece, nodeId, channelName)
      await this.pieceGltfService.upsertMaterialChannelUpload(piece, channel, dto)
      return channel
    }

    // piece
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
