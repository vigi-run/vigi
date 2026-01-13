import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { useTranslations } from '../i18n/utils';

export async function GET(context) {
	const t = useTranslations('pt-BR');
	const posts = await getCollection('blog');
	return rss({
		title: t.siteTitle,
		description: t.siteDescription,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.id}/`,
		})),
	});
}
