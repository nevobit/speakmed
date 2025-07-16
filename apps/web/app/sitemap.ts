export default function sitemap() {
    const baseUrl = 'https://template.com'

    return [
        {
            url: baseUrl,
            lastModified: new Date()
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date()
        },
    ]
}