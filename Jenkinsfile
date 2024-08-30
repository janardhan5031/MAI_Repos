pipeline {
	agent any
	options {
        skipStagesAfterUnstable()
		timeout(time: 30, unit: 'MINUTES')
    	}
	environment {
		DEV_ECR_URL = '408153089286.dkr.ecr.ap-south-1.amazonaws.com/storage-backend-dev'
		DEV_ENV = 'dev' 
        QA_ECR_URL = '408153089286.dkr.ecr.ap-south-1.amazonaws.com/storage-backend-qa'
		QA_ENV = 'qa'
        STG_ECR_URL = '408153089286.dkr.ecr.ap-south-1.amazonaws.com/storage-backend-stg'
		STG_ENV = 'stg'
    }
	stages {
		stage('DEV_BUILD') {
			when{
				branch 'development'
			}
			steps {
				script {
					committerEmail = sh (
      				script: 'git log -1 --pretty=format:"%an"', returnStdout: true
					).trim()
				}
				echo "Committer Email : '${committerEmail}'"
				slackSend (	color: 'good', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Job has initiated : #${env.BUILD_NUMBER} by ${committerEmail}")
				slackSend (	color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build is started : #${env.BUILD_NUMBER}")
				echo "Step: BUILD, initiated..."
				sh "docker build -t '${DEV_ECR_URL}':'${BUILD_NUMBER}' . --no-cache"
				slackSend (	color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build has been completed : #${env.BUILD_NUMBER}")
			}
		}
		stage('DEV_ECR PUSH') {
			when{
				branch 'development'
			}
			steps {
				echo "Step: Pushing Image ..."
				sh "aws ecr get-login --no-include-email --region ap-south-1 | sh"
				sh "docker push '${DEV_ECR_URL}':${BUILD_NUMBER}"
           		slackSend (	color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build has been pushed to the ECR : #${env.BUILD_NUMBER}")
			}
		}
		stage('DEV_DEPLOY') {
			when{
				branch 'development'
			}
			steps {
				echo "Deploying into '${DEV_ENV}' environment"
				sh "aws eks --region ap-south-1 update-kubeconfig --name p2epro-stg"
				sh "sed -i 's/<VERSION>/${BUILD_NUMBER}/g' deployment-'${DEV_ENV}'.yaml"
				sh "kubectl apply -f deployment-'${DEV_ENV}'.yaml"
				echo "'${DEV_ENV}' deployment completed: '${env.BUILD_ID}' on '${env.BUILD_URL}'"
           		slackSend (	color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Deployment has been completed : #${env.BUILD_NUMBER}")
			}
		}
		stage('QA_BUILD') {
			when{
				branch 'qa'
			}
			steps {
				script {
					committerEmail = sh (
      				script: 'git log -1 --pretty=format:"%an"',
      				returnStdout: true
					).trim()
				}
				echo "Committer Email : '${committerEmail}'"
				slackSend (	color: 'good', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Job has initiated : #${env.BUILD_NUMBER} by ${committerEmail}")
				slackSend (	color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build is started : #${env.BUILD_NUMBER}")
				echo "Step: BUILD, initiated..."
				sh "docker build -t '${QA_ECR_URL}':'${BUILD_NUMBER}' . --no-cache"
				slackSend ( color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build has been completed : #${env.BUILD_NUMBER}")
			}
		}
		stage('QA_ECR PUSH') {
			when{
				branch 'qa'
			}
			steps {
				echo "Step: Pushing Image ..."
				sh "aws ecr get-login --no-include-email --region ap-south-1 | sh"
				sh "docker push '${QA_ECR_URL}':${BUILD_NUMBER}"
           		slackSend ( color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build has been pushed to the ECR : #${env.BUILD_NUMBER}")
			}
		}
		stage('QA_DEPLOY') {
			when{
				branch 'qa'
			}
			steps {
				echo "Deploying into '${QA_ENV}' environment"
				sh "aws eks --region ap-south-1 update-kubeconfig --name p2epro-stg"
				sh "sed -i 's/<VERSION>/${BUILD_NUMBER}/g' deployment-'${QA_ENV}'.yaml"
				sh "kubectl apply -f deployment-'${QA_ENV}'.yaml"
				echo "'${QA_ENV}' deployment completed: '${env.BUILD_ID}' on '${env.BUILD_URL}'"
           		slackSend (	color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Deployment has been completed : #${env.BUILD_NUMBER}")
			}
		}
		stage('STG_BUILD') {
			when{
				branch 'stage'
			}
			steps {
				script {
					committerEmail = sh (
      				script: 'git log -1 --pretty=format:"%an"',
      				returnStdout: true
					).trim()
				}
				echo "Committer Email : '${committerEmail}'"
				slackSend (	color: 'good', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Job has initiated : #${env.BUILD_NUMBER} by ${committerEmail}")
				slackSend (	color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build is started : #${env.BUILD_NUMBER}")
				echo "Step: BUILD, initiated..."
				sh "docker build -t '${STG_ECR_URL}':'${BUILD_NUMBER}' . --no-cache"
				slackSend ( color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build has been completed : #${env.BUILD_NUMBER}")
			}
		}
		stage('STG_ECR PUSH') {
			when{
				branch 'stage'
			}
			steps {
				echo "Step: Pushing Image ..."
				sh "aws ecr get-login --no-include-email --region ap-south-1 | sh"
				sh "docker push '${STG_ECR_URL}':${BUILD_NUMBER}"
           		slackSend ( color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Build has been pushed to the ECR : #${env.BUILD_NUMBER}")
			}
		}
		stage('STG_DEPLOY') {
			when{
				branch 'stage'
			}
			steps {
				echo "Deploying into '${STG_ENV}' environment"
				sh "aws eks --region ap-south-1 update-kubeconfig --name p2epro-stg"
				sh "sed -i 's/<VERSION>/${BUILD_NUMBER}/g' deployment-'${STG_ENV}'.yaml"
				sh "kubectl apply -f deployment-'${STG_ENV}'.yaml"
				echo "'${STG_ENV}' deployment completed: '${env.BUILD_ID}' on '${env.BUILD_URL}'"
           		slackSend (	color: 'warning', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Deployment has been completed : #${env.BUILD_NUMBER}")
			}
		}
		stage('POST_CHECKS') {
			when{
				expression {
                   	env.BRANCH_NAME == 'development' || env.BRANCH_NAME == 'qa' || env.BRANCH_NAME == 'stage'
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
					slackSend (	color: 'good', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Job has succeeded : #${env.BUILD_NUMBER} in ${currentBuild.durationString.replace(' and counting', '')} \n For more info, please click (<${env.BUILD_URL}|here>)")
			        echo "Good to deploy into STG"
				}
				failure {
					slackSend (	color: 'danger', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | @channel - Job has failed #${env.BUILD_NUMBER}\nPlease check full info, (<${env.BUILD_URL}|here>)")
				}
			}
		}
	}
	post {
		always {
			echo "ALWAYS last-post check"
		}
		aborted {
			slackSend (
				color: '#AEACAC', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | Job has aborted : #${env.BUILD_NUMBER} in ${currentBuild.durationString.replace(' and counting', '')} \n For more info, please click (<${env.BUILD_URL}|here>)")
		}
		failure {
			slackSend (
				color: 'danger', channel: '#pl-builds-alerts', message: "${env.JOB_NAME} | @channel - Job has failed #${env.BUILD_NUMBER}\nPlease check full info, (<${env.BUILD_URL}|here>)")
		}
	}
}
