import os
import requests
from typing import Any, Dict, List, Optional

# Базовый адрес микросервиса Backend
BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "http://backend:3000")


def search_brands(query: str) -> List[Dict[str, Any]]:
    """
    Поиск брендов в базе данных оптовых поставок (Amazon Wholesale).
    Возвращает список брендов, их статус, количество товаров и заметки.
    """
    try:
        url = f"{BACKEND_API_URL}/brands"
        params = {"search": query}
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return [{"error": f"Ошибка поиска брендов: {str(e)}"}]


def get_distributors() -> List[Dict[str, Any]]:
    """
    Получить справочник официальных дистрибьюторов и поставщиков.
    """
    try:
        url = f"{BACKEND_API_URL}/distributors"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return [{"error": f"Ошибка получения дистрибьюторов: {str(e)}"}]
