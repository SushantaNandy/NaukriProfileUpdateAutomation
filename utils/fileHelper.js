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
  
  // Create a fresh name based on current date and time e.g. SDETSushantaResume_23_04_14_30_45.pdf
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  const baseName = 'SDETSushantaResume';
  const newName = `${baseName}_${day}_${month}_${hours}_${minutes}_${seconds}${ext}`;
  const newPath = path.join(dataDirPath, newName);

  // Rename on disk if names are different
  if (currentResumePath !== newPath) {
    fs.renameSync(currentResumePath, newPath);
  }

  return newPath;
}

module.exports = {
  getFreshResumePath
};
