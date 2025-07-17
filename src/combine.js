import { readdir, readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';

async function combineFiles() {
  try {
    // Get all .md files in the src directory
    const srcDir = './src';
    const rootDir = './';
    const files = await readdir(srcDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    // Read the shared.md content
    const sharedPath = join(srcDir, 'shared.md');
    const sharedContent = await readFile(sharedPath, 'utf8');
    
    // Process each .md file except shared.md
    for (const file of mdFiles) {
      if (file === 'shared.md') continue;
      
      const filePath = join(srcDir, file);
      const fileContent = await readFile(filePath, 'utf8');
      
      // Determine what content to append
      let appendContent = sharedContent;
      
      // Special case for static_html.md - replace sdk. with miniapp.sdk.
      if (file === 'static_html.md') {
        appendContent = sharedContent.replace(/sdk\./g, 'miniapp.sdk.');
      }
      
      // Combine the content
      const combinedContent = fileContent + '\n\n' + appendContent;
      
      // Create the output filename
      const outputFileName = `LLM_INSTRUCTIONS_${basename(file)}`;
      const outputPath = join(rootDir, outputFileName);
      
      // Write the combined file
      await writeFile(outputPath, combinedContent);
      console.log(`Created ${outputFileName}`);
    }
    
    console.log('All files combined successfully!');
  } catch (error) {
    console.error('Error combining files:', error);
  }
}

// Run the function
combineFiles();
