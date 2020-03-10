
def uploadCoverageStaticSite(timestamp, liveAppPath) {
  def uploadPrefix = "gs://elastic-bekitzur-kibana-coverage-live/jobs/${env.JOB_NAME}/${timestamp}/"

  uploadWithVault(uploadPrefix, 'src/dev/code_coverage/404.html')
  uploadWithVault(uploadPrefix, 'src/dev/code_coverage/' + liveAppPath)

  def dataUploadPrefix = uploadPrefix + liveAppPath + '/coverage_data/'
  uploadCoverageHtml(dataUploadPrefix)
}

def uploadWithVault(prefix, x) {
  def vaultSecret = 'secret/gce/elastic-bekitzur/service-account/kibana'

  withGcpServiceAccount.fromVaultSecret(vaultSecret, 'value') {
    sh """
        gsutil -m cp -r -a public-read -z js,css,html ${x} '${prefix}'
      """
  }
}

def uploadCoverageHtml(prefix) {
  def coverageHtmlPaths = [
    'target/kibana-coverage/functional-combined',
    'target/kibana-coverage/jest-combined',
    'target/kibana-coverage/mocha-combined',
  ]

  coverageHtmlPaths.each { x ->
    uploadWithVault(prefix, x)
  }
}

