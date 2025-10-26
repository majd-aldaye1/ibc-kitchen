export function catSlug(s: string) {
return (s || 'general')
.toLowerCase()
.replace(/&/g, 'and')
.replace(/[^a-z0-9]+/g, '-')
.replace(/(^-|-$)/g, '')
}