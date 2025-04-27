/**
 * VOX File Parser
 * Based on MagicaVoxel .vox file format specification
 */
class VoxParser {
    constructor() {
        this.defaultPalette = this._generateDefaultPalette();
    }

    /**
     * Parse a VOX file from an ArrayBuffer
     * @param {ArrayBuffer} buffer - The VOX file data
     * @returns {Object} The parsed voxel model
     */
    parse(buffer) {
        console.log('Starting VOX file parsing...');
        
        if (!buffer || !(buffer instanceof ArrayBuffer)) {
            console.error('Invalid buffer provided:', buffer);
            throw new Error('Invalid buffer: expected ArrayBuffer');
        }
        
        if (buffer.byteLength < 8) {
            console.error('Buffer too small:', buffer.byteLength, 'bytes');
            throw new Error('Buffer too small to be a valid VOX file');
        }
        
        const dataView = new DataView(buffer);
        let offset = 0;

        try {
            // Check VOX header
            const header = this._readString(dataView, offset, 4);
            offset += 4;
            
            console.log('VOX header:', header);
            
            if (header !== 'VOX ') {
                console.error('Invalid VOX header:', header);
                throw new Error(`Invalid VOX file: header should be 'VOX ' but was '${header}'`);
            }
    
            // Check version number
            const version = dataView.getUint32(offset, true);
            offset += 4;
            
            console.log('VOX version:', version);
            
            if (version !== 150) {
                console.warn(`VOX version is ${version}, expected 150. The file may not parse correctly.`);
            }
    
            // Read MAIN chunk
            const mainId = this._readString(dataView, offset, 4);
            offset += 4;
            
            console.log('Main chunk ID:', mainId);
            
            if (mainId !== 'MAIN') {
                console.error('Expected MAIN chunk, found:', mainId);
                throw new Error(`Expected MAIN chunk, but found '${mainId}'`);
            }
    
            // Skip MAIN chunk content size
            const mainContentSize = dataView.getUint32(offset, true);
            offset += 4;
            
            // Read MAIN children size
            const mainChildrenSize = dataView.getUint32(offset, true);
            offset += 4;
            
            console.log('MAIN content size:', mainContentSize, 'children size:', mainChildrenSize);
    
            // Initialize data structure for the model
            const voxelData = {
                version: version,
                models: [],
                palette: this.defaultPalette,
            };
    
            // Temporary storage for model data before it is associated with size
            let currentSize = null;
    
            // Read all chunks in MAIN
            console.log('Starting chunk parsing...');
            const endOffset = offset + mainChildrenSize;
            
            if (endOffset > buffer.byteLength) {
                console.error('Invalid MAIN chunk size exceeds buffer length');
                throw new Error('Invalid chunk size: data would extend beyond buffer');
            }
            
            while (offset < endOffset) {
                if (offset + 12 > buffer.byteLength) {
                    console.error('Unable to read chunk header, offset:', offset, 'buffer size:', buffer.byteLength);
                    break;
                }
                
                const chunkId = this._readString(dataView, offset, 4);
                offset += 4;
                const chunkContentSize = dataView.getUint32(offset, true);
                offset += 4;
                const chunkChildrenSize = dataView.getUint32(offset, true);
                offset += 4;
                
                console.log('Found chunk:', chunkId, 'content size:', chunkContentSize, 'children size:', chunkChildrenSize);
                
                // Check if we have enough data to read the chunk
                if (offset + chunkContentSize > buffer.byteLength) {
                    console.error('Chunk extends beyond buffer:', chunkId);
                    break;
                }
    
                try {
                    switch (chunkId) {
                        case 'PACK':
                            // Number of models
                            const numModels = dataView.getUint32(offset, true);
                            voxelData.numModels = numModels;
                            console.log('PACK: Number of models:', numModels);
                            break;
        
                        case 'SIZE':
                            // Model size
                            if (chunkContentSize < 12) {
                                console.error('SIZE chunk too small:', chunkContentSize);
                                break;
                            }
                            
                            const sizeX = dataView.getUint32(offset, true);
                            const sizeY = dataView.getUint32(offset + 4, true);
                            const sizeZ = dataView.getUint32(offset + 8, true);
                            
                            console.log('SIZE:', sizeX, sizeY, sizeZ);
                            
                            currentSize = { x: sizeX, y: sizeY, z: sizeZ };
                            break;
        
                        case 'XYZI':
                            // Model voxels
                            if (!currentSize) {
                                console.error('Found XYZI chunk before SIZE chunk');
                                throw new Error('Found XYZI chunk before SIZE chunk');
                            }
                            
                            if (chunkContentSize < 4) {
                                console.error('XYZI chunk too small:', chunkContentSize);
                                break;
                            }
                            
                            const numVoxels = dataView.getUint32(offset, true);
                            const voxels = [];
                            
                            console.log('XYZI: Number of voxels:', numVoxels);
                            
                            // Verify we have enough data for all voxels
                            if (4 + (numVoxels * 4) > chunkContentSize) {
                                console.error('XYZI chunk too small for declared voxel count');
                                break;
                            }
                            
                            for (let i = 0; i < numVoxels; i++) {
                                const voxelOffset = offset + 4 + (i * 4);
                                
                                if (voxelOffset + 4 > buffer.byteLength) {
                                    console.error('Voxel data extends beyond buffer');
                                    break;
                                }
                                
                                const x = dataView.getUint8(voxelOffset);
                                const y = dataView.getUint8(voxelOffset + 1);
                                const z = dataView.getUint8(voxelOffset + 2);
                                const colorIndex = dataView.getUint8(voxelOffset + 3);
                                
                                voxels.push({
                                    x, y, z, colorIndex
                                });
                            }
                            
                            voxelData.models.push({
                                size: currentSize,
                                voxels: voxels
                            });
                            
                            console.log('Added model with', voxels.length, 'voxels');
                            
                            currentSize = null;
                            break;
        
                        case 'RGBA':
                            // Custom palette
                            if (chunkContentSize < 1024) { // 256 * 4 bytes
                                console.error('RGBA chunk too small:', chunkContentSize);
                                break;
                            }
                            
                            const palette = [];
                            
                            // Add a transparent color as the first entry (index 0)
                            palette.push({ r: 0, g: 0, b: 0, a: 0 });
                            
                            // Read 255 palette entries
                            for (let i = 0; i < 255; i++) {
                                const colorOffset = offset + (i * 4);
                                const r = dataView.getUint8(colorOffset);
                                const g = dataView.getUint8(colorOffset + 1);
                                const b = dataView.getUint8(colorOffset + 2);
                                const a = dataView.getUint8(colorOffset + 3);
                                
                                palette.push({ r, g, b, a });
                            }
                            
                            voxelData.palette = palette;
                            console.log('Loaded custom palette with 256 colors');
                            break;
        
                        default:
                            // Skip unknown chunk
                            console.warn(`Skipping unknown chunk type: ${chunkId}`);
                    }
                } catch (chunkError) {
                    console.error('Error processing chunk', chunkId, ':', chunkError);
                }
    
                // Move to next chunk
                offset += chunkContentSize + chunkChildrenSize;
            }
            
            console.log('Completed parsing VOX file.', 
                'Models:', voxelData.models.length, 
                'Total voxels:', voxelData.models.reduce((sum, model) => sum + model.voxels.length, 0));
    
            return voxelData;
        } catch (error) {
            console.error('Error parsing VOX file:', error);
            throw error;
        }
    }

    /**
     * Read a string from a DataView
     */
    _readString(dataView, offset, length) {
        try {
            let str = '';
            for (let i = 0; i < length; i++) {
                if (offset + i >= dataView.byteLength) {
                    console.error('String read beyond end of buffer');
                    return str; // Return what we have so far
                }
                str += String.fromCharCode(dataView.getUint8(offset + i));
            }
            return str;
        } catch (error) {
            console.error('Error reading string at offset', offset, ':', error);
            return '';
        }
    }

    /**
     * Generate the default palette as per MagicaVoxel specification
     */
    _generateDefaultPalette() {
        // Default palette from MagicaVoxel spec
        const defaultRgbaValues = [
            0x00000000, 0xffffffff, 0xffccffff, 0xff99ffff, 0xff66ffff, 0xff33ffff, 0xff00ffff, 0xffffccff, 0xffccccff, 0xff99ccff, 0xff66ccff, 0xff33ccff, 0xff00ccff, 0xffff99ff, 0xffcc99ff, 0xff9999ff,
            0xff6699ff, 0xff3399ff, 0xff0099ff, 0xffff66ff, 0xffcc66ff, 0xff9966ff, 0xff6666ff, 0xff3366ff, 0xff0066ff, 0xffff33ff, 0xffcc33ff, 0xff9933ff, 0xff6633ff, 0xff3333ff, 0xff0033ff, 0xffff00ff,
            0xffcc00ff, 0xff9900ff, 0xff6600ff, 0xff3300ff, 0xff0000ff, 0xffffffcc, 0xffccffcc, 0xff99ffcc, 0xff66ffcc, 0xff33ffcc, 0xff00ffcc, 0xffffcccc, 0xffcccccc, 0xff99cccc, 0xff66cccc, 0xff33cccc,
            0xff00cccc, 0xffff99cc, 0xffcc99cc, 0xff9999cc, 0xff6699cc, 0xff3399cc, 0xff0099cc, 0xffff66cc, 0xffcc66cc, 0xff9966cc, 0xff6666cc, 0xff3366cc, 0xff0066cc, 0xffff33cc, 0xffcc33cc, 0xff9933cc,
            0xff6633cc, 0xff3333cc, 0xff0033cc, 0xffff00cc, 0xffcc00cc, 0xff9900cc, 0xff6600cc, 0xff3300cc, 0xff0000cc, 0xffffff99, 0xffccff99, 0xff99ff99, 0xff66ff99, 0xff33ff99, 0xff00ff99, 0xffffcc99,
            0xffcccc99, 0xff99cc99, 0xff66cc99, 0xff33cc99, 0xff00cc99, 0xffff9999, 0xffcc9999, 0xff999999, 0xff669999, 0xff339999, 0xff009999, 0xffff6699, 0xffcc6699, 0xff996699, 0xff666699, 0xff336699,
            0xff006699, 0xffff3399, 0xffcc3399, 0xff993399, 0xff663399, 0xff333399, 0xff003399, 0xffff0099, 0xffcc0099, 0xff990099, 0xff660099, 0xff330099, 0xff000099, 0xffffff66, 0xffccff66, 0xff99ff66,
            0xff66ff66, 0xff33ff66, 0xff00ff66, 0xffffcc66, 0xffcccc66, 0xff99cc66, 0xff66cc66, 0xff33cc66, 0xff00cc66, 0xffff9966, 0xffcc9966, 0xff999966, 0xff669966, 0xff339966, 0xff009966, 0xffff6666,
            0xffcc6666, 0xff996666, 0xff666666, 0xff336666, 0xff006666, 0xffff3366, 0xffcc3366, 0xff993366, 0xff663366, 0xff333366, 0xff003366, 0xffff0066, 0xffcc0066, 0xff990066, 0xff660066, 0xff330066,
            0xff000066, 0xffffff33, 0xffccff33, 0xff99ff33, 0xff66ff33, 0xff33ff33, 0xff00ff33, 0xffffcc33, 0xffcccc33, 0xff99cc33, 0xff66cc33, 0xff33cc33, 0xff00cc33, 0xffff9933, 0xffcc9933, 0xff999933,
            0xff669933, 0xff339933, 0xff009933, 0xffff6633, 0xffcc6633, 0xff996633, 0xff666633, 0xff336633, 0xff006633, 0xffff3333, 0xffcc3333, 0xff993333, 0xff663333, 0xff333333, 0xff003333, 0xffff0033,
            0xffcc0033, 0xff990033, 0xff660033, 0xff330033, 0xff000033, 0xffffff00, 0xffccff00, 0xff99ff00, 0xff66ff00, 0xff33ff00, 0xff00ff00, 0xffffcc00, 0xffcccc00, 0xff99cc00, 0xff66cc00, 0xff33cc00,
            0xff00cc00, 0xffff9900, 0xffcc9900, 0xff999900, 0xff669900, 0xff339900, 0xff009900, 0xffff6600, 0xffcc6600, 0xff996600, 0xff666600, 0xff336600, 0xff006600, 0xffff3300, 0xffcc3300, 0xff993300,
            0xff663300, 0xff333300, 0xff003300, 0xffff0000, 0xffcc0000, 0xff990000, 0xff660000, 0xff330000, 0xff0000ee, 0xff0000dd, 0xff0000bb, 0xff0000aa, 0xff000088, 0xff000077, 0xff000055, 0xff000044,
            0xff000022, 0xff000011, 0xff00ee00, 0xff00dd00, 0xff00bb00, 0xff00aa00, 0xff008800, 0xff007700, 0xff005500, 0xff004400, 0xff002200, 0xff001100, 0xffee0000, 0xffdd0000, 0xffbb0000, 0xffaa0000,
            0xff880000, 0xff770000, 0xff550000, 0xff440000, 0xff220000, 0xff110000, 0xffeeeeee, 0xffdddddd, 0xffbbbbbb, 0xffaaaaaa, 0xff888888, 0xff777777, 0xff555555, 0xff444444, 0xff222222, 0xff111111
        ];

        const palette = [];
        
        // Add each color to the palette
        for (let i = 0; i < defaultRgbaValues.length; i++) {
            const color = defaultRgbaValues[i];
            const r = (color >> 24) & 0xFF;
            const g = (color >> 16) & 0xFF;
            const b = (color >> 8) & 0xFF;
            const a = color & 0xFF;
            
            palette.push({ r, g, b, a });
        }
        
        return palette;
    }
}

// Export the parser
window.VoxParser = VoxParser; 