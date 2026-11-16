import { Link, useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useApi, type ArticleSummary } from '../api';
import { ErrorBox, Header, Loading, Page } from '../ui';

export function ArticleList() {
  const { data, error, loading, reload } = useApi<{ articles: ArticleSummary[] }>('/articles');
  return (
    <>
      <Header title="Artigos e dicas" />
      <Page>
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        <div className="space-y-3">
          {data?.articles.map((a) => (
            <Link key={a.id} to={`/artigos/${a.slug}`} className="card block p-4">
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold text-brand">{a.category}</span>
              <p className="mt-2 text-sm font-bold">{a.title}</p>
              <p className="mt-1 text-xs text-[#6b6780]">{a.summary}</p>
              <p className="mt-2 flex items-center gap-1 text-[10px] text-[#8e8aa3]">
                <Clock size={12} /> {a.minutes} min de leitura
              </p>
            </Link>
          ))}
        </div>
      </Page>
    </>
  );
}

export function ArticleView() {
  const { slug } = useParams();
  const { data, error, loading } = useApi<{ article: ArticleSummary & { body: string } }>(`/articles/${slug}`);
  const a = data?.article;
  return (
    <>
      <Header title="Artigo" />
      <Page>
        {error && <ErrorBox message={error} />}
        {loading && !data && <Loading />}
        {a && (
          <article>
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold text-brand">{a.category}</span>
            <h1 className="mt-2 text-xl font-extrabold">{a.title}</h1>
            <p className="mt-1 text-xs text-[#8e8aa3]">{a.minutes} min de leitura</p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#2e2a40]">
              {a.body.split('\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </article>
        )}
      </Page>
    </>
  );
}
