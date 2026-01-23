"""
Source Model
Represents a news source to scrape
"""

from datetime import datetime
import json


def create_source_model(db):
    """Create Source model"""
    
    class Source(db.Model):
        __tablename__ = 'sources'
        
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(200), nullable=False)
        url = db.Column(db.String(1000), nullable=False)
        state_code = db.Column(db.String(10))  # TN, MH, etc.
        category = db.Column(db.String(100))
        scraper_type = db.Column(db.String(50))  # rss, web, api
        is_active = db.Column(db.Boolean, default=True)
        last_scraped = db.Column(db.DateTime)
        
        def to_dict(self):
            return {
                'id': self.id,
                'name': self.name,
                'url': self.url,
                'state_code': self.state_code,
                'category': self.category,
                'scraper_type': self.scraper_type,
                'is_active': self.is_active,
                'last_scraped': self.last_scraped.isoformat() if self.last_scraped else None
            }
    
    return Source
