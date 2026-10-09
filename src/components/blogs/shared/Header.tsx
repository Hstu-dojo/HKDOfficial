import { CustomPortableText } from './CustomPortableText'


interface HeaderProps {
  centered?: boolean
  description?: any[]
  title?: string
}
export function Header(props: HeaderProps) {
  const { title, description, centered = false } = props
  if (!description && !title) {
    return null
  }
  return (
    <div className={`${centered ? 'text-center' : 'w-full max-w-3xl'}`}>
      {/* Title */}
      {title && (
        <h1 className="mb-6 font-serif text-4xl font-normal leading-[1.12] tracking-tight md:text-6xl">{title}</h1>
      )}
      {/* Description */}
      {description && (
        <div className="mt-4 font-serif text-xl text-muted-foreground md:text-2xl">
          <CustomPortableText value={description} />
        </div>
      )}
    </div>
  )
}
