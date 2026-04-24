> ⚠️ **DOCUMENT OBSOLÈTE — NE PAS UTILISER COMME RÉFÉRENCE**
>
> Ce guide décrit un état ancien du système de signup (septembre 2025) qui ne reflète plus la réalité en production. Le trigger `handle_new_user` a été réécrit depuis, et le mapping `job_role` → `service_type` a changé. Les instructions « appliquer la migration », « rétablir la contrainte » etc. ne sont **plus valides**.
>
> **Pour la documentation à jour sur `profiles`, `staff_directory`, les triggers et les RLS, voir :**
> **[docs/ARCHITECTURE_USERS_AND_STAFF.md](docs/ARCHITECTURE_USERS_AND_STAFF.md)** — dernière mise à jour : 2026-04-24.
>
> Ce fichier est conservé pour archive historique uniquement.

---

# Guide de Configuration - Résolution du Problème d'Inscription

## 🔍 **Problème Identifié**

### **Tables Impliquées**
1. **`auth.users`** - Table Supabase pour l'authentification (emails/mots de passe)
2. **`public.profiles`** - Table personnalisée pour les informations supplémentaires (nom, rôle, hiérarchie)

### **Causes du Bug**
1. **Trigger manquant** - Pas de création automatique du profil dans `public.profiles`
2. **Configuration email** - Emails de confirmation non configurés en développement
3. **Contrainte supprimée** - Lien entre `auth.users` et `profiles` cassé

## 🛠️ **Solutions Appliquées**

### **1. Migration de Correction (`20250911000001_fix_user_registration.sql`)**
- ✅ Rétablit la contrainte de clé étrangère
- ✅ Crée la fonction `handle_new_user()` 
- ✅ Crée le trigger automatique `on_auth_user_created`
- ✅ Configure les politiques RLS appropriées

### **2. Amélioration du Hook `useAuth.tsx`**
- ✅ Meilleure gestion des métadonnées
- ✅ Logs pour debug
- ✅ Gestion d'erreurs améliorée

### **3. Mapping des Rôles**
```sql
-- Job Role → User Role Enum
'a receptionist' → 'staff'
'Housekeeping Supervisor' → 'housekeeping' 
'Room Attendant' → 'housekeeping'
'restaurant staff' → 'staff'
'tech maintenance team' → 'maintenance'

-- Hiérarchie → Ajustement Role
'Manager' → 'manager'
'Director' → 'admin'
'Normal' → rôle de base selon job_role
```

## 📋 **Instructions pour Appliquer les Corrections**

### **Étape 1: Appliquer la Migration**
```bash
# Se connecter à Supabase et exécuter la migration
supabase db push
```

**OU manuellement dans l'interface Supabase :**
1. Aller dans **Database > SQL Editor**
2. Coller le contenu de `20250911000001_fix_user_registration.sql`
3. Exécuter la requête

### **Étape 2: Vérifier la Configuration Email**
1. **Dashboard Supabase** → **Authentication** → **Settings**
2. **Email Templates** → Vérifier que les templates sont configurés
3. **Pour le développement** - Désactiver "Confirm email" si souhaité

### **Étape 3: Tester l'Inscription**
1. Essayer de créer un nouveau compte
2. Vérifier dans **Database** → **Table Editor** → **auth.users**
3. Vérifier dans **Database** → **Table Editor** → **profiles**

## 🔍 **Comment Vérifier que ça Marche**

### **Vérification Tables Supabase**
```sql
-- Vérifier les utilisateurs inscrits
SELECT * FROM auth.users ORDER BY created_at DESC;

-- Vérifier les profils créés automatiquement  
SELECT * FROM public.profiles ORDER BY created_at DESC;

-- Vérifier la correspondance
SELECT 
    u.email,
    u.created_at as user_created,
    p.first_name,
    p.last_name, 
    p.role,
    p.department,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

### **Test d'Inscription**
1. **Créer un nouveau compte** avec :
   - Role: "Housekeeping Supervisor"
   - Hierarchy: "Manager" 
   - Email: test@example.com
   
2. **Vérifier** que :
   - Un utilisateur est créé dans `auth.users`
   - Un profil est automatiquement créé dans `profiles`
   - Le mapping role = 'manager' (à cause de hiérarchie)
   - Le department = 'Housekeeping Supervisor'

## 🎯 **Résultat Attendu**

Après les corrections :
- ✅ L'inscription fonctionne sans email de confirmation en dev
- ✅ Le profil est automatiquement créé avec les bonnes informations
- ✅ Les rôles et hiérarchies sont correctement mappés
- ✅ L'utilisateur peut se connecter immédiatement

Si ça ne marche toujours pas, vérifier les logs dans la console browser et les erreurs dans le Dashboard Supabase.
