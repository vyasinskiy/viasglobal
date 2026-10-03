import os
import requests
from typing import Any, Dict, List, Optional

# Базовый адрес микросервиса Accountant
ACCOUNTANT_API_URL = os.environ.get("ACCOUNTANT_API_URL", "http://accruals-accountant:3005")


def get_tenants(include_deleted: bool = False) -> List[Dict[str, Any]]:
    """
    Получить актуальный список арендаторов и квартир из системы учета аренды.
    Возвращает список объектов с полями: id, name, apartmentAddress, rentAmount, rentPaymentDay.
    """
    try:
        url = f"{ACCOUNTANT_API_URL}/tenants"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        # Нормализуем данные для удобного восприятия моделью
        result = []
        for t in data:
            if not include_deleted and t.get("status") == "deleted":
                continue
            user_info = t.get("user") or {}
            apt_info = t.get("apartment") or {}
            result.append({
                "tenantId": t.get("id"),
                "name": user_info.get("name") or f"Жилец #{t.get('id')}",
                "apartmentId": t.get("apartmentId"),
                "apartmentAddress": apt_info.get("address") or apt_info.get("externalId") or "Не указан",
                "rentAmount": float(t.get("rentAmount") or 0.0),
                "rentPaymentDay": t.get("rentPaymentDay"),
                "status": t.get("status")
            })
        return result
    except Exception as e:
        return [{"error": f"Ошибка получения списка арендаторов: {str(e)}"}]


def get_latest_invoices(account_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Получить список последних квитанций и начислений ЖКУ.
    """
    try:
        url = f"{ACCOUNTANT_API_URL}/invoices"
        params = {"take": 50}
        if account_id:
            params["accountId"] = account_id
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return [{"error": f"Ошибка получения квитанций: {str(e)}"}]


def record_payment(
    tenant_id: int,
    amount: float,
    comment: str,
    payment_date: Optional[str] = None,
    bank: str = "Не указан"
) -> Dict[str, Any]:
    """
    Внести подтвержденный арендный платеж в базу данных.
    Вызывать ТОЛЬКО после явного согласия пользователя!
    """
    try:
        url = f"{ACCOUNTANT_API_URL}/payments"
        payload = {
            "tenantId": int(tenant_id),
            "amount": float(amount),
            "comment": f"[{bank}] {comment}" if bank else comment,
            "status": "confirmed"
        }
        if payment_date:
            payload["createdAt"] = payment_date

        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return {
            "success": True,
            "message": f"Платеж на сумму {amount} руб. успешно записан в БД",
            "data": response.json()
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Не удалось создать платеж: {str(e)}"
        }
