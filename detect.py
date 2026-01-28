import os
from dotenv import load_dotenv
from roboflow import Roboflow

# Load environment variables
load_dotenv()

# Initialize Roboflow
rf = Roboflow(api_key=os.getenv('ROBOFLOW_API_KEY'))

# Use environment variables for everything
workspace_name = os.getenv('ROBOFLOW_WORKSPACE')
project_name = os.getenv('ROBOFLOW_PROJECT')

project = rf.workspace(workspace_name).project(project_name)
dataset = project.version(1).download("yolov8")

print(f"✓ Dataset downloaded to: {dataset.location}")