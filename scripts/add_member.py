#!/usr/bin/env python3
"""
Скрипт для автоматического добавления участников из принятых заявок
"""

import json
import os
from datetime import datetime

def add_member_from_application():
    # Чтение данных
    try:
        with open('data/applications.json', 'r', encoding='utf-8') as f:
            applications = json.load(f)
        
        with open('data/members.json', 'r', encoding='utf-8') as f:
            members = json.load(f)
    except FileNotFoundError:
        print("Файлы данных не найдены")
        return
    
    # Находим принятые заявки, которые еще не обработаны
    new_members = []
    for app in applications:
        if app['status'] == 'accepted' and not app.get('processed', False):
            # Генерируем новый ID
            new_id = max([m['id'] for m in members], default=0) + 1
            
            # Создаем нового участника
            new_member = {
                'id': new_id,
                'nickname': app['nickname'],
                'username': app['telegram'],
                'category': app['category'],
                'role': app['category'],
                'description': app['description'],
                'avatar': f'img/avatar{new_id}.png',
                'verified': False,
                'pinned': False,
                'scam': False,
                'project': app['links'][0] if app['links'] else "",
                'telegram': app['telegram'].replace('@', ''),
                'joinDate': datetime.now().strftime('%Y-%m-%d'),
                'activity': "Постоянная",
                'details': app['description'],
                'skills': ["Новый участник"],
                'socials': {'telegram': app['telegram']}
            }
            
            new_members.append(new_member)
            
            # Помечаем заявку как обработанную
            app['processed'] = True
    
    # Добавляем новых участников
    if new_members:
        members.extend(new_members)
        
        # Сохраняем данные
        with open('data/members.json', 'w', encoding='utf-8') as f:
            json.dump(members, f, ensure_ascii=False, indent=2)
        
        with open('data/applications.json', 'w', encoding='utf-8') as f:
            json.dump(applications, f, ensure_ascii=False, indent=2)
        
        print(f"Добавлено {len(new_members)} новых участников")
        
        # Создаем заглушки для аватарок
        for member in new_members:
            avatar_path = f"frontend/{member['avatar']}"
            if not os.path.exists(avatar_path):
                # Здесь можно добавить генерацию аватарки
                print(f"Создана заглушка для: {avatar_path}")
    else:
        print("Нет новых заявок для обработки")

if __name__ == "__main__":
    add_member_from_application()