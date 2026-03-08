'use client'

import { Beer, Zap, MapPin, Sunset, TrendingUp, PenLine, CircleCheck, Copy, Lightbulb, Medal, Bell, BellOff, Star, Waves, Baby, Flame, CloudRain, Sun, Umbrella, Users, Clock, Dices, Target, Flag, Trophy, DollarSign, BarChart3, Map as MapIcon, Share2, CirclePlay, CloudSun, CloudLightning, Snowflake, Cloud, Moon, Circle, CircleDot, Coffee, Building2, Landmark, Anchor } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  beer: Beer,
  zap: Zap,
  'map-pin': MapPin,
  sunset: Sunset,
  'trending-up': TrendingUp,
  'pen-line': PenLine,
  'circle-check': CircleCheck,
  copy: Copy,
  lightbulb: Lightbulb,
  medal: Medal,
  bell: Bell,
  'bell-off': BellOff,
  star: Star,
  waves: Waves,
  baby: Baby,
  flame: Flame,
  'cloud-rain': CloudRain,
  sun: Sun,
  umbrella: Umbrella,
  users: Users,
  clock: Clock,
  dices: Dices,
  target: Target,
  flag: Flag,
  trophy: Trophy,
  'dollar-sign': DollarSign,
  'bar-chart': BarChart3,
  map: MapIcon,
  share: Share2,
  'circle-play': CirclePlay,
  'cloud-sun': CloudSun,
  'cloud-lightning': CloudLightning,
  snowflake: Snowflake,
  cloud: Cloud,
  moon: Moon,
  circle: Circle,
  'circle-dot': CircleDot,
  coffee: Coffee,
  'building-2': Building2,
  landmark: Landmark,
  anchor: Anchor,
}

interface LucideIconProps {
  name: string
  className?: string
}

export default function LucideIcon({ name, className = 'w-4 h-4' }: LucideIconProps) {
  const Icon = iconMap[name]
  if (!Icon) return <span>{name}</span>
  return <Icon className={className} />
}
