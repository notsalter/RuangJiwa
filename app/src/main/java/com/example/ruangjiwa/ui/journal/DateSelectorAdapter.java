package com.example.ruangjiwa.ui.journal;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ruangjiwa.R;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class DateSelectorAdapter extends RecyclerView.Adapter<DateSelectorAdapter.DateViewHolder> {

    private final List<Date> dates;
    private final OnDateClickListener listener;
    private int selectedPosition = -1;
    private final Calendar today = Calendar.getInstance();

    public interface OnDateClickListener {
        void onDateClick(Date date, int position);
    }

    public DateSelectorAdapter(List<Date> dates, OnDateClickListener listener) {
        this.dates = dates;
        this.listener = listener;

        // Set today as default selection
        Calendar todayCal = Calendar.getInstance();
        todayCal.set(Calendar.HOUR_OF_DAY, 0);
        todayCal.set(Calendar.MINUTE, 0);
        todayCal.set(Calendar.SECOND, 0);
        todayCal.set(Calendar.MILLISECOND, 0);

        // Find today's position
        for (int i = 0; i < dates.size(); i++) {
            Calendar dateCal = Calendar.getInstance();
            dateCal.setTime(dates.get(i));
            dateCal.set(Calendar.HOUR_OF_DAY, 0);
            dateCal.set(Calendar.MINUTE, 0);
            dateCal.set(Calendar.SECOND, 0);
            dateCal.set(Calendar.MILLISECOND, 0);

            if (dateCal.equals(todayCal)) {
                selectedPosition = i;
                break;
            }
        }
    }

    @NonNull
    @Override
    public DateViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_date_selector, parent, false);
        return new DateViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull DateViewHolder holder, int position) {
        holder.bind(dates.get(position), position);
    }

    @Override
    public int getItemCount() {
        return dates.size();
    }

    public void setSelectedPosition(int position) {
        int oldPosition = selectedPosition;
        selectedPosition = position;
        notifyItemChanged(oldPosition);
        notifyItemChanged(selectedPosition);
    }

    class DateViewHolder extends RecyclerView.ViewHolder {
        private final TextView tvDayOfWeek;
        private final TextView tvDayOfMonth;
        private final CardView cardDate;

        public DateViewHolder(@NonNull View itemView) {
            super(itemView);
            tvDayOfWeek = itemView.findViewById(R.id.tv_day_of_week);
            tvDayOfMonth = itemView.findViewById(R.id.tv_day_of_month);
            cardDate = itemView.findViewById(R.id.card_date);

            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION) {
                    setSelectedPosition(position);
                    listener.onDateClick(dates.get(position), position);
                }
            });
        }

        public void bind(Date date, int position) {
            // Format day of week (abbreviated)
            SimpleDateFormat dayFormat = new SimpleDateFormat("EEE", new Locale("id", "ID"));
            String dayOfWeek = dayFormat.format(date);
            tvDayOfWeek.setText(dayOfWeek);

            // Format day of month
            SimpleDateFormat dateFormat = new SimpleDateFormat("d", Locale.getDefault());
            String dayOfMonth = dateFormat.format(date);
            tvDayOfMonth.setText(dayOfMonth);

            // Check if this date is today
            Calendar dateCalendar = Calendar.getInstance();
            dateCalendar.setTime(date);

            boolean isToday = dateCalendar.get(Calendar.YEAR) == today.get(Calendar.YEAR)
                    && dateCalendar.get(Calendar.DAY_OF_YEAR) == today.get(Calendar.DAY_OF_YEAR);

            // Set selected state
            boolean isSelected = position == selectedPosition;

            // Apply correct styling
            if (isSelected) {
                cardDate.setCardBackgroundColor(itemView.getContext().getColor(R.color.primary));
                tvDayOfWeek.setTextColor(itemView.getContext().getColor(R.color.white));
                tvDayOfMonth.setTextColor(itemView.getContext().getColor(R.color.white));
            } else {
                cardDate.setCardBackgroundColor(itemView.getContext().getColor(R.color.white));
                tvDayOfWeek.setTextColor(itemView.getContext().getColor(R.color.gray_400));
                tvDayOfMonth.setTextColor(itemView.getContext().getColor(R.color.gray_700));
            }

            // Highlight today
            if (isToday && !isSelected) {
                tvDayOfMonth.setTextColor(itemView.getContext().getColor(R.color.primary));
            }
        }
    }
}
