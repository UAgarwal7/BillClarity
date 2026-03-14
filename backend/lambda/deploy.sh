#!/bin/bash
sam deploy --stack-name billclarity-pipeline --resolve-s3 --capabilities CAPABILITY_IAM \
  --parameter-overrides MongoDBUri="mongodb+srv://nagarap_db_user:PMNsaysIronman1%21@rockethacks.8df2eri.mongodb.net/billclarity?appName=RocketHacks" GeminiApiKey="AIzaSyD6EiQlaATYx-5AjFLljT2ubycD0YRyeng" S3BucketName="billclarity-docs-891377296503" Environment="dev"
