
package com.applitools.eyes.metadata;

import com.applitools.utils.Iso8610CalendarDeserializer;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import java.util.Calendar;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({
        "id",
        "name",
        "startedAt",
        "batchSequenceName"
})
public class BatchInfo {

    @JsonProperty("id")
    private String id;
    @JsonProperty("name")
    private String name;

    @JsonProperty("batchSequenceName")
    private String sequenceName;

    @JsonProperty("startedAt")
    @JsonDeserialize(using = Iso8610CalendarDeserializer.class)
    private Calendar startedAt;

    @JsonProperty("properties")
    private List<Map<String, String>> properties;

    @JsonProperty("isCompleted")
    private Boolean isCompleted;

    @JsonProperty("pointerId")
    private String pointerId;

    @JsonProperty("id")
    public String getId() {
        return id;
    }

    @JsonProperty("id")
    public void setId(String id) {
        this.id = id;
    }

    @JsonProperty("name")
    public String getName() {
        return name;
    }

    @JsonProperty("name")
    public void setName(String name) {
        this.name = name;
    }

    @JsonProperty("startedAt")
    public Calendar getStartedAt() {
        return startedAt;
    }

    @JsonProperty("startedAt")
    public void setStartedAt(Calendar startedAt) {
        this.startedAt = startedAt;
    }

    @JsonProperty("batchSequenceName")
    public String getSequenceName() {
        return sequenceName;
    }

    public void setSequenceName(String sequenceName) {
        this.sequenceName = sequenceName;
    }

    public List<Map<String, String>> getProperties() {
        return properties;
    }

    public void setProperties(List<Map<String, String>> properties) {
        this.properties = properties;
    }

    @JsonProperty("isCompleted")
    public boolean getIsCompleted() {
        return isCompleted;
    }

    @JsonProperty("isCompleted")
    public void setIsCompleted(Boolean isCompleted) {
        this.isCompleted = isCompleted;
    }

    public String getPointerId() {
        return pointerId;
    }

    public void setPointerId(String pointerId) {
        this.pointerId = pointerId;
    }
}
