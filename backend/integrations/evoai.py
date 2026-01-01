"""
EvoAI Integration Module

This module provides integration with EvoAI for conversational AI agents.
EvoAI is available only for Pro and Enterprise plans.
"""

import httpx
from typing import Dict, Any, Optional
import os
import logging

logger = logging.getLogger(__name__)

EVOAI_URL = os.getenv("EVOAI_URL", "http://evoai-backend:8000")
EVOAI_API_KEY = os.getenv("EVOAI_API_KEY", "28hub-evoai-integration-2025")


class EvoAIIntegration:
    """Integration with EvoAI for conversational AI agents"""

    def __init__(self, base_url: str = None, api_key: str = None):
        """
        Initialize EvoAI integration

        Args:
            base_url: EvoAI service URL
            api_key: API key for authentication
        """
        self.base_url = base_url or EVOAI_URL
        self.api_key = api_key or EVOAI_API_KEY

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

    async def health_check(self) -> bool:
        """
        Check if EvoAI service is healthy

        Returns:
            True if service is healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self.base_url}/",
                    timeout=5.0
                )
                is_healthy = response.status_code == 200
                if is_healthy:
                    logger.info("EvoAI health check passed")
                else:
                    logger.warning(f"EvoAI health check failed: status {response.status_code}")
                return is_healthy
        except Exception as e:
            logger.error(f"EvoAI health check error: {str(e)}")
            return False

    async def create_agent(
        self,
        tenant_id: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a new AI agent for a tenant

        Args:
            tenant_id: Tenant identifier
            config: Agent configuration including:
                - name: Agent name
                - model: AI model (e.g., "gpt-4", "gpt-4o", "claude-3-5-sonnet")
                - instruction: System instructions
                - client_id: EvoAI client ID (required)
                - api_key: Optional API key for the agent

        Returns:
            Created agent data

        Raises:
            httpx.HTTPError: If request fails
        """
        try:
            # Validate required client_id
            client_id = config.get("client_id")
            if not client_id:
                raise ValueError("client_id is required in config")

            # Build the agent configuration according to EvoAI AgentCreate schema
            agent_payload = {
                "client_id": client_id,
                "name": config.get("name", f"{tenant_id}_agent"),
                "type": "llm",  # Required field: agent type
                "model": config.get("model", "gpt-4o"),
                "instruction": config.get(
                    "instruction",
                    "You are a helpful customer service assistant"
                ),
                "description": config.get("description", f"AI agent for tenant {tenant_id}"),
                "role": config.get("role", "Customer Service"),
                "goal": config.get("goal", "Assist customers with their inquiries"),
                "config": {
                    "api_key": config.get("api_key")  # Will be auto-generated if not provided
                }
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/agents",
                    headers=self._get_headers(),
                    json=agent_payload
                )
                response.raise_for_status()
                agent_data = response.json()
                logger.info(f"Created EvoAI agent {agent_data.get('id')} for tenant {tenant_id}")
                return agent_data
        except httpx.HTTPError as e:
            logger.error(f"Failed to create EvoAI agent: {str(e)}")
            raise

    async def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Get agent details by ID

        Args:
            agent_id: Agent identifier

        Returns:
            Agent data or None if not found
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/agents/{agent_id}",
                    headers=self._get_headers(),
                    timeout=10.0
                )
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to get EvoAI agent {agent_id}: {str(e)}")
            raise

    async def update_agent(
        self,
        agent_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing agent

        Args:
            agent_id: Agent identifier
            updates: Fields to update

        Returns:
            Updated agent data
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.put(
                    f"{self.base_url}/api/v1/agents/{agent_id}",
                    headers=self._get_headers(),
                    json=updates
                )
                response.raise_for_status()
                logger.info(f"Updated EvoAI agent {agent_id}")
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to update EvoAI agent {agent_id}: {str(e)}")
            raise

    async def delete_agent(self, agent_id: str) -> bool:
        """
        Delete an agent

        Args:
            agent_id: Agent identifier

        Returns:
            True if deleted successfully
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.delete(
                    f"{self.base_url}/api/v1/agents/{agent_id}",
                    headers=self._get_headers()
                )
                response.raise_for_status()
                logger.info(f"Deleted EvoAI agent {agent_id}")
                return True
        except httpx.HTTPError as e:
            logger.error(f"Failed to delete EvoAI agent {agent_id}: {str(e)}")
            raise

    async def send_message(
        self,
        agent_id: str,
        external_id: str,
        message: str,
        files: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Send a message to an AI agent

        Args:
            agent_id: Agent identifier
            external_id: External user/session identifier
            message: User message
            files: Optional list of files to send

        Returns:
            Agent response data

        Raises:
            httpx.HTTPError: If request fails
        """
        try:
            payload = {
                "message": message,
                "files": files or []
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/chat/{agent_id}/{external_id}",
                    headers=self._get_headers(),
                    json=payload,
                    timeout=60.0
                )
                response.raise_for_status()
                result = response.json()
                logger.debug(f"Sent message to EvoAI agent {agent_id}")
                return result
        except httpx.HTTPError as e:
            logger.error(f"Failed to send message to EvoAI agent {agent_id}: {str(e)}")
            raise

    async def get_session_messages(
        self,
        session_id: str
    ) -> list:
        """
        Get message history for a session

        Args:
            session_id: Session identifier

        Returns:
            List of messages
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/sessions/{session_id}/messages",
                    headers=self._get_headers(),
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to get session messages: {str(e)}")
            raise

    async def get_agent_sessions(
        self,
        agent_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> list:
        """
        Get all sessions for an agent

        Args:
            agent_id: Agent identifier
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of sessions
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/sessions/agent/{agent_id}",
                    headers=self._get_headers(),
                    params={"skip": skip, "limit": limit},
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to get agent sessions: {str(e)}")
            raise

    async def create_session(
        self,
        agent_id: str,
        client_phone: str
    ) -> Dict[str, Any]:
        """
        Create a new chat session for WhatsApp integration

        Args:
            agent_id: Agent identifier
            client_phone: Client phone number

        Returns:
            Session data

        Raises:
            httpx.HTTPError: If request fails
        """
        try:
            # In EvoAI, sessions are automatically created when sending messages
            # The external_id in chat endpoints serves as the session identifier
            # This method returns a session structure for tracking
            return {
                "agent_id": agent_id,
                "external_id": client_phone,
                "metadata": {"channel": "whatsapp"},
                "created_at": None  # Will be set on first message
            }
        except Exception as e:
            logger.error(f"Failed to create session: {str(e)}")
            raise

    async def get_agent_api_key(self, agent_id: str) -> Optional[str]:
        """
        Get the API key for sharing an agent

        Args:
            agent_id: Agent identifier

        Returns:
            API key or None if not found
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/agents/{agent_id}/share",
                    headers=self._get_headers(),
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json().get("api_key")
        except httpx.HTTPError as e:
            logger.error(f"Failed to get agent API key: {str(e)}")
            return None


# Global instance for easy import
evoai = EvoAIIntegration()
