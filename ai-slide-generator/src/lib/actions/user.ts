'use server'

import { supabase } from '@/lib/supabase/client'
import { getRoleLimits } from '@/lib/auth/limits'

/**
 * Normalizes legacy percentage-based (0-100) slide element coordinates 
 * to absolute pixels on a 1920x1080 grid.
 */
function normalizePresentationData(pres: any) {
  if (!pres || !Array.isArray(pres.slides)) return pres;

  // 1. Detect if this is a legacy percentage-based presentation
  // If ANY coordinate or dimension in ANY element across ALL slides is > 100,
  // we safely assume it is ALREADY using absolute pixels.
  let isLegacy = true;
  for (const slide of pres.slides) {
    if (!Array.isArray(slide.elements)) continue;
    for (const el of slide.elements) {
      if ((el.x !== undefined && el.x > 100) ||
        (el.y !== undefined && el.y > 100) ||
        (el.width !== undefined && el.width > 100) ||
        (el.height !== undefined && el.height > 100)) {
        isLegacy = false;
        break;
      }
    }
    if (!isLegacy) break;
  }

  if (!isLegacy) return pres;

  // 2. Migrate legacy percentages to 1920x1080 absolute pixels
  const normalizedSlides = pres.slides.map((slide: any) => {
    if (!Array.isArray(slide.elements)) return slide;
    return {
      ...slide,
      elements: slide.elements.map((el: any) => {
        const newEl = { ...el };
        if (typeof newEl.x === 'number') newEl.x = Math.round((newEl.x / 100) * 1920);
        if (typeof newEl.y === 'number') newEl.y = Math.round((newEl.y / 100) * 1080);
        if (typeof newEl.width === 'number') newEl.width = Math.round((newEl.width / 100) * 1920);
        if (typeof newEl.height === 'number') newEl.height = Math.round((newEl.height / 100) * 1080);
        return newEl;
      })
    };
  });

  return { ...pres, slides: normalizedSlides };
}

export async function getUserSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching subscription:', error)
    return null
  }

  return data
}

export async function getUserPresentations(userId: string) {
  const { data, error } = await supabase
    .from('presentations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching presentations:', error)
    return []
  }

  return data.map(normalizePresentationData)
}

export async function createPresentation(userId: string, title: string, slides: any, theme: string = 'default', hasCustomApiKey: boolean = false) {
  // 1. Get user role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    console.error('Error fetching user for limit check:', userError)
    return { success: false, error: 'User not found' }
  }

  // 2. Count existing presentations
  const { count, error: countError } = await supabase
    .from('presentations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    console.error('Error counting presentations:', countError)
    return { success: false, error: 'Could not verify limits' }
  }

  // 3. Check limits (skip if custom API key is used)
  if (!hasCustomApiKey) {
    const { maxPresentations, label } = getRoleLimits((userData as any).role)
    if (count !== null && count >= maxPresentations) {
      return {
        success: false,
        error: `Лимит ашылды. Сиздин тариф (${label}) боюнча максимум ${maxPresentations} презентация түзүүгө болот.`
      }
    }
  }

  // 4. Create presentation
  const { data: pres, error: insertObjErr } = await supabase
    .from('presentations')
    .insert({
      user_id: userId,
      title,
      slides: slides as any,
      theme,
    } as any)
    .select('id')
    .single()

  if (insertObjErr) {
    console.error('Error creating presentation:', insertObjErr)
    return { success: false, error: insertObjErr.message }
  }

  return { success: true, data: pres }
}

export async function getPresentationById(id: string) {
  const { data, error } = await supabase
    .from('presentations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching presentation:', id, error)
    return null
  }

  return normalizePresentationData(data)
}

export async function updatePresentation(id: string, updates: any) {
  const { error } = await supabase
    .from('presentations')
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating presentation:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

import { revalidatePath } from 'next/cache'

export async function deletePresentation(id: string) {
  const { error } = await supabase
    .from('presentations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting presentation:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
