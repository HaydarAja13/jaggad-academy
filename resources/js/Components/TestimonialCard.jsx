import { Star, CheckCircle } from 'lucide-react';
import './TestimonialCard.css';

export default function TestimonialCard({ testimonial }) {
    return (
        <div className="testimonial-card">
            <div className="testimonial-card__rating">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={14} 
                        fill={i < (testimonial.rating || 5) ? "var(--color-warning)" : "transparent"} 
                        color={i < (testimonial.rating || 5) ? "var(--color-warning)" : "var(--color-border)"}
                    />
                ))}
            </div>
            
            <p className="testimonial-card__text">"{testimonial.text}"</p>
            
            <div className="testimonial-card__author">
                <div className="author-avatar">
                   {testimonial.avatar ? (
                       <img src={testimonial.avatar} alt={testimonial.name} />
                   ) : (
                       <span>{testimonial.name[0]}</span>
                   )}
                </div>
                <div className="author-info">
                    <p className="author-name">{testimonial.name}</p>
                    <p className="author-role">{testimonial.role} · {testimonial.company}</p>
                </div>
                <div className="verified-badge">
                   Verified
                </div>
            </div>
        </div>
    );
}
