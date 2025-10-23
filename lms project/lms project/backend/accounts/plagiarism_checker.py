"""
PlagiarismCheck.org API Integration for LMS
"""

import requests
import time
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Assignment, AssignmentSubmission, User
from django.utils import timezone

class PlagiarismChecker:
    def __init__(self):
        self.api_token = "fVEJzkpyOd-4NRJOwnYKAxJCxM_U5MKo"
        self.base_url = "https://plagiarismcheck.org/api/v1"
        self.headers = {
            "X-API-TOKEN": self.api_token
        }
    
    def check_text(self, text, language="en"):
        """
        Submit text for plagiarism checking
        """
        try:
            if len(text) < 80:
                return {"error": "Text must be at least 80 characters long"}
            
            url = f"{self.base_url}/text"
            data = {
                "language": language,
                "text": text
            }
            
            response = requests.post(url, headers=self.headers, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    return {
                        "success": True,
                        "text_id": result["data"]["text"]["id"],
                        "message": "Text submitted for checking"
                    }
                else:
                    return {"error": "Failed to submit text for checking"}
            else:
                return {"error": f"API request failed with status {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Error submitting text: {str(e)}"}
    
    def check_status(self, text_id):
        """
        Check the status of plagiarism checking
        """
        try:
            url = f"{self.base_url}/text/{text_id}"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "status": result["data"]["state"],
                    "status_name": self._get_status_name(result["data"]["state"])
                }
            else:
                return {"error": f"Failed to check status: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Error checking status: {str(e)}"}
    
    def get_report(self, text_id):
        """
        Get plagiarism report
        """
        try:
            url = f"{self.base_url}/text/{text_id}"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "report": result["data"]
                }
            else:
                return {"error": f"Failed to get report: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Error getting report: {str(e)}"}
    
    def _get_status_name(self, status_id):
        """
        Get status name from ID
        """
        status_map = {
            2: "STORED",
            3: "SUBMITTED", 
            4: "FAILED",
            5: "CHECKED"
        }
        return status_map.get(status_id, "UNKNOWN")
    
    def check_text_complete(self, text, language="en", max_wait_time=300):
        """
        Complete plagiarism check with waiting for results
        """
        # Submit text
        submit_result = self.check_text(text, language)
        if not submit_result.get("success"):
            return submit_result
        
        text_id = submit_result["text_id"]
        
        # Wait for completion
        start_time = time.time()
        while time.time() - start_time < max_wait_time:
            status_result = self.check_status(text_id)
            if not status_result.get("success"):
                return status_result
            
            status_id = status_result["status"]
            
            if status_id == 5:  # CHECKED
                # Get report
                report_result = self.get_report(text_id)
                if report_result.get("success"):
                    return {
                        "success": True,
                        "text_id": text_id,
                        "report": report_result["report"]
                    }
                else:
                    return report_result
            elif status_id == 4:  # FAILED
                return {"error": "Plagiarism check failed"}
            
            # Wait 5 seconds before checking again
            time.sleep(5)
        
        return {"error": "Plagiarism check timed out"}

# Global instance
plagiarism_checker = PlagiarismChecker()



