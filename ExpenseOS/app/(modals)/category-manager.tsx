// app/(modals)/category-manager.tsx
// Category Manager Modal Screen
// Features: List current categories by section, create custom categories with color/icon selectors, and delete custom categories.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { CategoryType, DEFAULT_CATEGORIES, Category } from '../../constants/defaultCategories';
import { useCategoryStore } from '../../store/categoryStore';

const ICONS = [
  'restaurant', 'car', 'bag', 'receipt', 'medkit', 'game-controller', 
  'school', 'home', 'repeat', 'briefcase', 'laptop', 'cash', 
  'gift', 'trending-up', 'shield-checkmark', 'trophy', 'bar-chart', 
  'lock-closed', 'wallet', 'airplane', 'beer', 'cafe', 'shirt', 'hammer'
];

const COLOR_PALETTE = [
  '#FF4D4D', '#FF8C00', '#FFB800', '#00D97E', '#00D9D9', 
  '#4DA6FF', '#6C63FF', '#A855F7', '#FF6FB8', '#A0A0B0'
];

export default function CategoryManager() {
  const { categories, addCategory, deleteCategory, getCategoriesByType } = useCategoryStore();

  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [newCatName, setNewCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [isAdding, setIsAdding] = useState(false);

  // Filtered categories based on active tab
  const listCategories = useMemo(() => getCategoriesByType(activeTab), [categories, activeTab, getCategoriesByType]);

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      Alert.alert('Required', 'Please enter a category name.');
      return;
    }

    const name = newCatName.trim();
    // Check if category name already exists in this section
    const exists = listCategories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      Alert.alert('Duplicate', 'A category with this name already exists.');
      return;
    }

    const id = `${activeTab.slice(0, 3)}-custom-${Date.now().toString(36)}`;
    const newCat: Category = {
      id,
      name,
      icon: selectedIcon,
      color: selectedColor,
      type: activeTab,
      isDefault: false
    };

    addCategory(newCat);
    setNewCatName('');
    setIsAdding(false);
    Alert.alert('Success 🎉', `Category "${name}" created!`);
  };

  const handleDeleteCategory = (cat: Category) => {
    if (cat.isDefault) {
      Alert.alert('Restricted', 'Default categories cannot be deleted.');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the category "${cat.name}"? Transactions using this category will remain, but the category listing will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteCategory(cat.id);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Modal Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Category Manager</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tabs for sections */}
        <View style={styles.tabs}>
          {(['income', 'saving', 'expense'] as CategoryType[]).map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.tab,
                activeTab === type && {
                  backgroundColor: type === 'income' ? Colors.income + '15' : type === 'expense' ? Colors.expense + '15' : Colors.saving + '15',
                  borderColor: type === 'income' ? Colors.income : type === 'expense' ? Colors.expense : Colors.saving
                }
              ]}
              onPress={() => {
                setActiveTab(type);
                setIsAdding(false);
              }}
            >
              <Text style={[
                styles.tabText,
                activeTab === type && {
                  color: type === 'income' ? Colors.income : type === 'expense' ? Colors.expense : Colors.saving,
                  fontWeight: '700'
                }
              ]}>
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Existing Categories */}
        {!isAdding && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Categories</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addBtnText}>Add New</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.list}>
              {listCategories.map(cat => (
                <View key={cat.id} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconWrapper, { backgroundColor: cat.color + '15' }]}>
                      <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                    </View>
                    <Text style={styles.itemName}>{cat.name}</Text>
                    {cat.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
                  </View>
                  {!cat.isDefault && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteCategory(cat)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.expense} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Add New Category form */}
        {isAdding && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Card style={styles.addFormCard}>
              <Text style={styles.formTitle}>New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Category</Text>

              {/* Name Input */}
              <TextInput
                style={styles.nameInput}
                placeholder="Category Name"
                placeholderTextColor={Colors.textMuted}
                value={newCatName}
                onChangeText={setNewCatName}
                maxLength={20}
              />

              {/* Color Selector */}
              <Text style={styles.fieldLabel}>Select Color</Text>
              <View style={styles.colorPalette}>
                {COLOR_PALETTE.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorDot,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorDotSelected
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>

              {/* Icon Selector */}
              <Text style={styles.fieldLabel}>Select Icon</Text>
              <View style={styles.iconPalette}>
                {ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconDot,
                      selectedIcon === icon && { backgroundColor: selectedColor, borderColor: selectedColor }
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={20}
                      color={selectedIcon === icon ? Colors.background : selectedColor}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelFormBtn} onPress={() => setIsAdding(false)}>
                  <Text style={styles.cancelFormText}>Cancel</Text>
                </TouchableOpacity>
                <AnimatedButton
                  label="Create Category"
                  variant="primary"
                  size="md"
                  onPress={handleAddCategory}
                  style={styles.createBtn}
                />
              </View>
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  closeBtn: { padding: Spacing.xs },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: Spacing.md },
  tabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  tabText: { ...Typography.caption, color: Colors.textMuted },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  sectionTitle: { ...Typography.bodyLarge, color: Colors.textSecondary, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600' },
  list: { gap: Spacing.xs },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  itemName: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '500' },
  defaultBadge: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginLeft: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  deleteBtn: { padding: Spacing.xs },
  addFormCard: { padding: Spacing.md, gap: Spacing.md },
  formTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.xs },
  nameInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    height: 48,
    color: Colors.textPrimary,
    ...Typography.bodyLarge
  },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary, marginTop: Spacing.xs },
  colorPalette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: Colors.textPrimary },
  iconPalette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconDot: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface
  },
  formActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  cancelFormBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  cancelFormText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1.5 },
});
