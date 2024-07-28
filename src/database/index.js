const fs = require('fs')
const path = require('path')
const readline = require('readline')

function promptForMigrationName() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('Enter the migration name: ', (name) => {
      rl.close()
      const formattedName = name.trim().toLowerCase().replace(/\s+/g, '_')
      resolve(formattedName)
    })
  })
}

function generateTimestampPrefix() {
  const now = new Date()
  return now.toISOString().replace(/[^0-9]/g, '')
}

async function createMigration() {
  const migrationName = await promptForMigrationName()
  const timestamp = generateTimestampPrefix()
  const migrationFolderName = `${timestamp}_${migrationName}`
  const projectRoot = path.resolve(__dirname, '..') // Root directory of the project
  const migrationsDirPath = path.join(projectRoot, 'migrations')
  const migrationFolderPath = path.join(migrationsDirPath, migrationFolderName)
  const migrationFilePath = path.join(migrationFolderPath, 'migration.sql')

  try {
    if (!fs.existsSync(migrationsDirPath)) {
      fs.mkdirSync(migrationsDirPath)
    }

    fs.mkdirSync(migrationFolderPath)

    fs.writeFileSync(
      migrationFilePath,
      '-- Add your SQL migration script here\n'
    )
    console.log(`Migration file created: ${migrationFolderPath}/migration.sql`)
  } catch (error) {
    console.error('Error creating migration:', error)
  }
}

createMigration()
