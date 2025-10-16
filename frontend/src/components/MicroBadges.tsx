import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MicroBadge {
  id: string;
  title: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  category: 'streak' | 'workout' | 'nutrition' | 'achievement';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

interface MicroBadgesProps {
  badges: MicroBadge[];
  maxVisible?: number;
  showUnlockedOnly?: boolean;
}

const MicroBadges: React.FC<MicroBadgesProps> = ({
  badges,
  maxVisible = 5,
  showUnlockedOnly = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#95A5A6';
      case 'uncommon': return '#2ECC71';
      case 'rare': return '#3498DB';
      case 'epic': return '#9B59B6';
      case 'legendary': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'streak': return 'flame';
      case 'workout': return 'fitness';
      case 'nutrition': return 'restaurant';
      case 'achievement': return 'trophy';
      default: return 'star';
    }
  };

  const filteredBadges = showUnlockedOnly 
    ? badges.filter(badge => badge.unlocked)
    : badges;

  const visibleBadges = filteredBadges.slice(0, maxVisible);

  if (visibleBadges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="star-outline" size={32} color="#CCCCCC" />
        <Text style={styles.emptyText}>No badges yet</Text>
        <Text style={styles.emptySubtext}>Keep logging to unlock badges!</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleBadges.map((badge, index) => (
          <Animated.View
            key={badge.id}
            style={[
              styles.badgeContainer,
              {
                opacity: badge.unlocked ? 1 : 0.3,
                transform: [
                  {
                    scale: badge.unlocked ? 1 : 0.8,
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.badge,
                {
                  borderColor: getRarityColor(badge.rarity),
                  backgroundColor: badge.unlocked 
                    ? `${getRarityColor(badge.rarity)}20` 
                    : '#F5F5F5',
                },
              ]}
            >
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              <View style={styles.badgeContent}>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <View style={styles.badgeCategory}>
                  <Ionicons
                    name={getCategoryIcon(badge.category) as any}
                    size={10}
                    color={getRarityColor(badge.rarity)}
                  />
                  <Text style={[styles.badgeCategoryText, { color: getRarityColor(badge.rarity) }]}>
                    {badge.category.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ))}
        
        {filteredBadges.length > maxVisible && (
          <View style={styles.moreBadges}>
            <Text style={styles.moreBadgesText}>
              +{filteredBadges.length - maxVisible} more
            </Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  badgeContainer: {
    marginRight: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  badgeContent: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  badgeCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeCategoryText: {
    fontSize: 8,
    fontWeight: '500',
    marginLeft: 4,
  },
  moreBadges: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  moreBadgesText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 4,
  },
});

export default MicroBadges;
