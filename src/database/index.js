const fs = require('fs');
const path = require('path');
const readline = require('readline');

function promptForAction() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter the action: ', (action) => {
      rl.close();
      const formattedAction = action.trim().toLowerCase().replace(/\s+/g, '_');
      resolve(formattedAction);
    });
  });
}

function getNextMigrationNumber(migrationsDirPath) {
  const files = fs.readdirSync(migrationsDirPath);
  console.log(files);
  const migrationFiles = files.filter(file => /^\d{3}\.(do|undo)\.\w+\.sql$/.test(file));

  if (migrationFiles.length === 0) {
    return '001';
  }

  const highestNumber = Math.max(...migrationFiles.map(file => parseInt(file.split('.')[0], 10)));
  const nextNumber = highestNumber + 1;
  return nextNumber.toString().padStart(3, '0');
}

async function createMigration() {
  const formattedAction = await promptForAction();
  const projectRoot = path.resolve(__dirname); // Adjust the path to point to the project root
  const migrationsDirPath = path.join(projectRoot, '../../', 'migrations');

  try {
    if (!fs.existsSync(migrationsDirPath)) {
      fs.mkdirSync(migrationsDirPath);
    }

    const nextMigrationNumber = getNextMigrationNumber(migrationsDirPath);
    const doActionFilePath = path.join(migrationsDirPath, `${nextMigrationNumber}.do.${formattedAction}.sql`);
    const undoActionFilePath = path.join(migrationsDirPath, `${nextMigrationNumber}.undo.${formattedAction}.sql`);

    fs.writeFileSync(doActionFilePath, 'begin;\n\n\ncommit;\n');
    fs.writeFileSync(undoActionFilePath, 'begin;\n\n\ncommit;\n');

    console.log(`Migration files created:\n${doActionFilePath}\n${undoActionFilePath}`);
  } catch (error) {
    console.error('Error creating migration:', error);
  }
}

createMigration();
