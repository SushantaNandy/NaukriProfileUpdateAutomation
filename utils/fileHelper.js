const fs = require('fs');
const path = require('path');

/**
 * Toggles or appends date to the resume file to ensure a "fresh" filename for Naukri
 * @param {string} dataDirPath - The path to the data directory containing the resume
 * @returns {string} - The path to the newly renamed resume
 */
function getFreshResumePath(dataDirPath) {
  // Find the existing resume file
  const files = fs.readdirSync(dataDirPath);
  const existingResume = files.find(f => f.toLowerCase().includes('resume') && f.endsWith('.pdf'));
  
  if (!existingResume) {
    throw new Error(`No resume file found in ${dataDirPath} containing 'resume' and ending with '.pdf'`);
  }

  const currentResumePath = path.join(dataDirPath, existingResume);
  const ext = '.pdf';
  
  // Create a fresh name based on current IST date and time e.g. SDETSushantaResume_23_04_14_30_45.pdf
  const date = new Date();
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const getPart = (type) => parts.find(p => p.type === type).value;
  
  const day = getPart('day');
  const month = getPart('month');
  const hours = getPart('hour');
  const minutes = getPart('minute');
  const seconds = getPart('second');
  
  const baseName = 'SDETSushantaResume';
  const newName = `${baseName}_${day}_${month}_${hours}_${minutes}_${seconds}${ext}`;
  const newPath = path.join(dataDirPath, newName);

  // Rename on disk if names are different
  if (currentResumePath !== newPath) {
    fs.renameSync(currentResumePath, newPath);
  }

  return newPath;
}

/**
 * Creates a timestamped copy of a resume file.
 * Format: [OriginalName]_DD_MM_HH_mm_ss.[ext]
 * @param {string} sourcePath - Path to the original resume
 * @returns {string} - Path to the newly created stamped resume
 */
function createStampedResume(sourcePath) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source resume not found: ${sourcePath}`);
  }

  const parsed = path.parse(sourcePath);
  const baseName = parsed.name;
  const ext = parsed.ext;

  const date = new Date();
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const getPart = (type) => parts.find(p => p.type === type).value;
  
  const day = getPart('day');
  const month = getPart('month');
  const hours = getPart('hour');
  const minutes = getPart('minute');
  const seconds = getPart('second');

  const newName = `${baseName}_${day}_${month}_${hours}_${minutes}_${seconds}${ext}`;
  const newPath = path.join(parsed.dir, newName);

  fs.copyFileSync(sourcePath, newPath);
  return newPath;
}

/**
 * Deletes the timestamped resume copy
 * @param {string} stampedPath - Path to the stamped resume
 */
function deleteStampedResume(stampedPath) {
  if (fs.existsSync(stampedPath)) {
    fs.unlinkSync(stampedPath);
    console.log(`Cleaned up stamped resume: ${path.basename(stampedPath)}`);
  }
}

module.exports = {
  getFreshResumePath,
  createStampedResume,
  deleteStampedResume
};
