package com.example.ruangjiwa.ui.home;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.Article;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class ArticlesAdapter extends RecyclerView.Adapter<ArticlesAdapter.ArticleViewHolder> {

    private List<Article> articles;
    private final Context context;
    private final OnArticleClickListener listener;

    public interface OnArticleClickListener {
        void onArticleClick(Article article);
    }

    public ArticlesAdapter(Context context, OnArticleClickListener listener) {
        this.context = context;
        this.listener = listener;
        this.articles = new ArrayList<>();
    }

    public void updateData(List<Article> newArticles) {
        this.articles = newArticles;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ArticleViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_article, parent, false);
        return new ArticleViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ArticleViewHolder holder, int position) {
        Article article = articles.get(position);
        holder.bind(article);
    }

    @Override
    public int getItemCount() {
        return articles.size();
    }

    class ArticleViewHolder extends RecyclerView.ViewHolder {
        private final ImageView articleImage;
        private final TextView articleCategory;
        private final TextView articleTitle;
        private final TextView articleDate;
        private final TextView readTime;

        public ArticleViewHolder(@NonNull View itemView) {
            super(itemView);
            articleImage = itemView.findViewById(R.id.articleImage);
            articleCategory = itemView.findViewById(R.id.articleCategory);
            articleTitle = itemView.findViewById(R.id.articleTitle);
            articleDate = itemView.findViewById(R.id.articleDate);
            readTime = itemView.findViewById(R.id.readTime);

            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onArticleClick(articles.get(position));
                }
            });
        }

        void bind(Article article) {
            // Set article title
            articleTitle.setText(article.getTitle());

            // Set article category
            articleCategory.setText(article.getCategory());

            // Format and set date
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMMM yyyy", new Locale("id", "ID"));
            articleDate.setText(dateFormat.format(article.getPublishedAt()));

            // Set read time
            readTime.setText(article.getReadTimeMinutes() + " menit");

            // Load image with Glide
            if (article.getImageUrl() != null && !article.getImageUrl().isEmpty()) {
                Glide.with(context)
                    .load(article.getImageUrl())
                    .placeholder(R.drawable.default_article_image)
                    .error(R.drawable.default_article_image)
                    .centerCrop()
                    .into(articleImage);
            } else {
                articleImage.setImageResource(R.drawable.default_article_image);
            }
        }
    }
}
