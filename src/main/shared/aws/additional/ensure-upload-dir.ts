import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function ensureUploadDirectory() {
    const uploadDir = path.join(process.cwd(), 'uploads');

    try {
        await fs.access(uploadDir);
        console.log('✅ Upload directory exists');
    } catch {
        try {
            await fs.mkdir(uploadDir, { recursive: true, mode: 0o777 });
            console.log('✅ Created upload directory with permissions 777');
        } catch (error) {
            console.error('❌ Failed to create upload directory:', error);
            throw error;
        }
    }

    // Try to fix permissions using chmod
    try {
        await fs.chmod(uploadDir, 0o777);
        console.log('✅ Set upload directory permissions to 777');
    } catch (chmodError) {
        console.warn('⚠️ Could not set permissions with fs.chmod, trying system command');
        try {
            await execAsync(`chmod -R 777 "${uploadDir}"`);
            console.log('✅ Set permissions using system chmod command');
        } catch (execError) {
            console.error('❌ Failed to set permissions:', execError);
        }
    }

    // Verify write permissions
    try {
        const testFile = path.join(uploadDir, '.write-test');
        await fs.writeFile(testFile, 'test', { mode: 0o666 });
        await fs.unlink(testFile);
        console.log('✅ Upload directory is writable');
    } catch (error) {
        console.error('❌ Upload directory is not writable:', error);
        console.error('Please run: sudo chmod -R 777 uploads');
        throw new Error('Upload directory permissions error - please fix manually');
    }
}
