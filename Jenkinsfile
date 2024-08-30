pipeline {
	agent any
	options {
        skipStagesAfterUnstable()
		timeout(time: 30, unit: 'MINUTES')
    	}
	environment { 
        	DEV_BUCKET_URL = 's3://dev-mai-configurator-fe'
		DEV_DIST_ID = 'E3J480G5CAG0V0'
        	QA_BUCKET_URL = 's3://qa-mai-configurator-fe'
		QA_DIST_ID = 'E511YEPG0MEY8'
		QA_INT_BUCKET_URL = 's3://qa-int-mai-configurator-fe'
		QA_INT_DIST_ID = 'EYEOJHVL5EU1Q'
		SLACK_CHANNEL = 'pl-builds-alerts' 
    }
	stages {
		stage('PRE_CHECKS') {
			when{
				expression {
                   	env.BRANCH_NAME == 'development' || env.BRANCH_NAME == 'qa' || env.BRANCH_NAME == 'integration-qa'
                }
			}
			steps {
				echo "Step: Deployment, initiated..."
				script {
					committerEmail = sh (
      				script: 'git log -1 --pretty=format:"%an"', returnStdout: true
					).trim()
				}
				echo "Committer Email : '${committerEmail}'"
				slackSend (color: 'good', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Job has initiated : #${env.BUILD_NUMBER} by ${committerEmail}")
				echo "Removing node_modules and previous build files"
				sh "rm -rf node_modules build"
			}
		}
		stage('BUILD') {
			when{
				expression {
                   	env.BRANCH_NAME == 'development' || env.BRANCH_NAME == 'qa' || env.BRANCH_NAME == 'integration-qa'
                }
			}
			steps {
				slackSend (color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build is started : #${env.BUILD_NUMBER}")
				sh "rm -rf node_modules build"
				sh "yarn cache clean"
				sh "yarn install && yarn run build"
			}
		}
		stage('DEV_S3') {
			when{
				branch 'development'
			}
			steps {
				sh "aws s3 sync dist '${DEV_BUCKET_URL}'"
				slackSend (color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build has been completed & uploaded : #${env.BUILD_NUMBER}")
			}
		}
		stage('DEV_CDN') {
			when{
				branch 'development'
			}
			steps {
				slackSend (color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Creating invalidation : #${env.BUILD_NUMBER}")
				sh "aws cloudfront create-invalidation --distribution-id ${DEV_DIST_ID} --paths '/*'"
				echo "Changes complete"
			}
		}
		stage('QA_S3') {
			when{
				branch 'qa'
			}
			steps {
				sh "aws s3 sync dist '${QA_BUCKET_URL}'"
				slackSend (color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build has been completed & uploaded : #${env.BUILD_NUMBER}")
			}
		}
		stage('QA_CDN') {
			when{
				branch 'qa'
			}
			steps {
				slackSend (color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Creating invalidation : #${env.BUILD_NUMBER}")
				sh "aws cloudfront create-invalidation --distribution-id ${QA_DIST_ID} --paths '/*'"
				echo "Changes complete"
			}
		}
		stage('QA_INT_S3') {
			when{
				branch 'integration-qa'
			}
			steps {
				sh "aws s3 sync dist '${QA_INT_BUCKET_URL}'"
				slackSend (color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build has been completed & uploaded : #${env.BUILD_NUMBER}")
			}
		}
		stage('QA_INT_CDN') {
			when{
				branch 'integration-qa'
			}
			steps {
				slackSend (color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Creating invalidation : #${env.BUILD_NUMBER}")
				sh "aws cloudfront create-invalidation --distribution-id ${QA_INT_DIST_ID} --paths '/*'"
				echo "Changes complete"
			}
		}
		stage('POST_CHECKS') {
			when{
				expression {
                   	env.BRANCH_NAME == 'development' || env.BRANCH_NAME == 'qa' || env.BRANCH_NAME == 'integration-qa'
                }
			}
			steps {
				echo "POST test"
			}	
			post {
				always {
					echo "ALWAYS test1"
				}
				success {
					slackSend (color: 'good', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Job has succeeded : #${env.BUILD_NUMBER} in ${currentBuild.durationString.replace(' and counting', '')} \n For more info, please click (<${env.BUILD_URL}|here>)")
				}
				failure {
					slackSend (color: 'danger', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | @channel - Job has failed #${env.BUILD_NUMBER}\nPlease check full info, (<${env.BUILD_URL}|here>)")
				}
			}
		}
	}
	post {
		always {
			echo "ALWAYS test2"
		}
		aborted {
			slackSend (color: '#AEACAC', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Job has aborted : #${env.BUILD_NUMBER} in ${currentBuild.durationString.replace(' and counting', '')} \n For more info, please click (<${env.BUILD_URL}|here>)")
		}
		failure {
			slackSend (color: 'danger', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | @channel - Job has failed #${env.BUILD_NUMBER}\nPlease check full info, (<${env.BUILD_URL}|here>)")
		}
	}
}
