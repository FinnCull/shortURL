package com.github.finncull.urlshortener.repository;

import com.github.finncull.urlshortener.model.URLMapping;
import org.springframework.data.repository.CrudRepository;

public interface URLRepository extends CrudRepository<URLMapping, String> {
}
