# Guide d'Utilisation - Système de Hover Unifié

## Vue d'ensemble

Ce guide présente le système de hover unifié pour HospitalityOS, utilisant la couleur jaune hôtel officielle : **Yellow RAL Pantone 6004C HTML #DEAE35**.

## Couleur Principale

```css
/* Couleur principale */
#DEAE35 /* Yellow RAL Pantone 6004C */
```

## Classes CSS Unifiées

### 1. Hover pour Cartes et Conteneurs

```css
.hotel-hover
```

**Utilisation :**
```tsx
<div className="hotel-hover cursor-pointer">
  <!-- Contenu de la carte -->
</div>
```

**Effet :** Bordure jaune + ombre douce au survol

### 2. Hover pour Boutons

```css
.hotel-button-hover
```

**Utilisation :**
```tsx
<Button className="hotel-button-hover">
  Mon Bouton
</Button>
```

**Effet :** Fond jaune + texte navy au survol

### 3. Hover pour Texte/Liens

```css
.hotel-text-hover
```

**Utilisation :**
```tsx
<a href="#" className="hotel-text-hover underline">
  Lien avec hover unifié
</a>
```

**Effet :** Couleur de texte devient jaune au survol

### 4. Hover Accent (Bordure + Fond Léger)

```css
.hotel-accent-hover
```

**Utilisation :**
```tsx
<div className="hotel-accent-hover p-4 border rounded">
  Élément avec accent hover
</div>
```

**Effet :** Bordure jaune + fond jaune très léger au survol

## Classes Spécifiques aux Composants

### 1. Catégories de Cartes

```css
.card-category-button
.card-category-button.selected
```

**Utilisation :**
```tsx
<div 
  className={cn(
    'card-category-button',
    isSelected && 'selected'
  )}
  onClick={() => setSelected(id)}
>
  <Icon className="h-5 w-5" />
  <span>Nom de la catégorie</span>
</div>
```

### 2. Boutons de Priorité

```css
.priority-button
.priority-button.selected
```

**Utilisation :**
```tsx
<Button 
  className={cn(
    'priority-button',
    isSelected && 'selected'
  )}
  onClick={() => setPriority(value)}
>
  {label}
</Button>
```

## Composants UI Modifiés

### Button Component

Tous les variants de Button utilisent maintenant le système unifié :

```tsx
<Button variant="default">Bouton Principal</Button>
<Button variant="outline">Bouton Outline</Button>
<Button variant="ghost">Bouton Ghost</Button>
<Button variant="link">Lien Bouton</Button>
```

### Tabs Component

Les onglets utilisent le jaune au survol et pour l'état actif :

```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Onglet 1</TabsTrigger>
    <TabsTrigger value="tab2">Onglet 2</TabsTrigger>
  </TabsList>
</Tabs>
```

## Exemple d'Application Complète

### Modal de Création de Carte

```tsx
const CardCreationModal = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const categories = [
    { id: 'incident', label: 'Ongoing Incident', icon: AlertTriangle },
    { id: 'request', label: 'Client Request', icon: Users },
    { id: 'followup', label: 'Follow-up', icon: Clock },
    { id: 'internal', label: 'Internal Task', icon: Wrench }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* Titre avec input hover unifié */}
        <Input 
          placeholder="Card title"
          className="hotel-hover"
        />
        
        {/* Catégories avec hover unifié */}
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className={cn(
                'card-category-button',
                selectedCategory === category.id && 'selected'
              )}
              onClick={() => setSelectedCategory(category.id)}
            >
              <category.icon className="h-5 w-5" />
              <span>{category.label}</span>
            </div>
          ))}
        </div>
        
        {/* Description avec hover unifié */}
        <Textarea 
          placeholder="Description..."
          className="hotel-hover"
        />
        
        {/* Boutons d'action */}
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Create Card</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

## Variables CSS Disponibles

```css
:root {
  --hotel-yellow: 43 72% 54%;  /* #DEAE35 */
  --hotel-navy: 248 36% 16%;   /* #1E1A37 */
  --accent: 43 72% 54%;        /* Force yellow for hover */
}
```

## Styles Inline (Si Nécessaire)

Pour les cas où les classes CSS ne suffisent pas :

```tsx
import { UNIFIED_HOVER_STYLES } from '@/config/hoverStyles';

// Style de bordure hover
<div style={UNIFIED_HOVER_STYLES.inline.borderHover}>
  Élément avec style inline
</div>

// Style de fond hover
<div style={UNIFIED_HOVER_STYLES.inline.backgroundHover}>
  Élément avec fond hover
</div>
```

## Règles à Suivre

### ✅ À Faire

- Utiliser les classes CSS unifiées (`hotel-hover`, `hotel-button-hover`, etc.)
- Appliquer le système sur tous les éléments interactifs
- Maintenir la cohérence avec la couleur #DEAE35
- Utiliser `transition-all duration-300` pour les animations

### ❌ À Éviter

- Définir des hovers personnalisés en blanc/gris/bleu
- Utiliser des couleurs de hover différentes du jaune hôtel
- Oublier d'appliquer les classes sur les nouveaux composants
- Mélanger différents systèmes de hover dans la même interface

## Test et Validation

Pour tester le système unifié, utilisez le composant exemple :

```tsx
import UnifiedHoverExample from '@/components/examples/UnifiedHoverExample';

// Dans votre page de test
<UnifiedHoverExample />
```

Ce composant montre tous les cas d'usage du système de hover unifié.
