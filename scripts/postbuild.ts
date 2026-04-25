import { writeManifest } from '../src/manifest'

const postBuildCommands = async () => {
    console.log('Generating Manifest..')
    await writeManifest()
}

postBuildCommands()
